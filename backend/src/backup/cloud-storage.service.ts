import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { encrypt, decrypt } from '../utils/encryption';

const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
];
const FOLDER_NAME = 'School-Management-Backups';

@Injectable()
export class CloudStorageService {
    private readonly backupsDir = path.resolve(process.cwd(), '../backups');

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get OAuth2 client - either from database credentials or environment variables
     */
    private async getOAuth2Client() {
        const settings = await this.prisma.backupSettings.findFirst();

        // First priority: Database credentials (admin-configured)
        let clientId = settings?.gdriveClientId;
        let clientSecret = settings?.gdriveClientSecret ? decrypt(settings.gdriveClientSecret) : null;
        let redirectUri = settings?.gdriveRedirectUri || 'http://localhost:3001/backup/cloud/callback';

        // Fallback: Environment variables
        if (!clientId || !clientSecret) {
            clientId = process.env.GOOGLE_CLIENT_ID || null;
            clientSecret = process.env.GOOGLE_CLIENT_SECRET || null;
            redirectUri = process.env.GOOGLE_REDIRECT_URI || redirectUri;
        }

        if (!clientId || !clientSecret) {
            return null;
        }

        return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    }

    /**
     * Check if Google Drive credentials are configured (either in DB or env vars)
     */
    async isConfigured(): Promise<boolean> {
        const settings = await this.prisma.backupSettings.findFirst();

        // Check DB credentials first
        if (settings?.gdriveClientId && settings?.gdriveClientSecret) {
            return true;
        }

        // Fallback to environment variables
        return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    }

    /**
     * Get OAuth authorization URL
     */
    async getAuthUrl(): Promise<string> {
        const oauth2Client = await this.getOAuth2Client();

        if (!oauth2Client) {
            throw new InternalServerErrorException(
                'Google OAuth not configured. Set credentials in Settings or via environment variables.'
            );
        }

        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent',  // Force consent to get refresh token
        });
    }

    /**
     * Handle OAuth callback and store tokens
     */
    async handleCallback(code: string): Promise<{ email: string }> {
        const oauth2Client = await this.getOAuth2Client();

        if (!oauth2Client) {
            throw new InternalServerErrorException('Google OAuth not configured');
        }

        try {
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);

            // Get user info to store email
            const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
            const userInfo = await oauth2.userinfo.get();
            const email = userInfo.data.email || 'unknown';

            // Store encrypted tokens in database
            await this.prisma.backupSettings.upsert({
                where: { id: 1 },
                update: {
                    gdriveEnabled: true,
                    gdriveTokens: encrypt(JSON.stringify(tokens)),
                    gdriveEmail: email,
                    gdriveConnectedAt: new Date(),
                },
                create: {
                    autoBackup: false,
                    gdriveEnabled: true,
                    gdriveTokens: encrypt(JSON.stringify(tokens)),
                    gdriveEmail: email,
                    gdriveConnectedAt: new Date(),
                },
            });

            // Create the backup folder in Drive if it doesn't exist
            await this.ensureBackupFolder();

            return { email };
        } catch (error) {
            throw new InternalServerErrorException(`OAuth callback failed: ${error.message}`);
        }
    }

    /**
     * Get current connection status
     */
    async getStatus(): Promise<{
        configured: boolean;
        connected: boolean;
        email?: string;
        connectedAt?: Date;
        credentialsSource?: 'database' | 'environment';
    }> {
        const configured = await this.isConfigured();

        if (!configured) {
            return { configured: false, connected: false };
        }

        const settings = await this.prisma.backupSettings.findFirst();

        // Determine credentials source
        let credentialsSource: 'database' | 'environment' = 'environment';
        if (settings?.gdriveClientId && settings?.gdriveClientSecret) {
            credentialsSource = 'database';
        }

        if (!settings?.gdriveEnabled || !settings?.gdriveTokens) {
            return { configured: true, connected: false, credentialsSource };
        }

        // Verify tokens are still valid
        try {
            const tokens = JSON.parse(decrypt(settings.gdriveTokens));
            const oauth2Client = await this.getOAuth2Client();

            if (!oauth2Client) {
                return { configured: true, connected: false, credentialsSource };
            }

            oauth2Client.setCredentials(tokens);

            // Try to refresh if needed
            if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
                const { credentials } = await oauth2Client.refreshAccessToken();
                await this.prisma.backupSettings.update({
                    where: { id: settings.id },
                    data: { gdriveTokens: encrypt(JSON.stringify(credentials)) },
                });
            }

            return {
                configured: true,
                connected: true,
                email: settings.gdriveEmail || undefined,
                connectedAt: settings.gdriveConnectedAt || undefined,
                credentialsSource,
            };
        } catch {
            return { configured: true, connected: false, credentialsSource };
        }
    }

    /**
     * Disconnect Google Drive (revoke tokens)
     */
    async disconnect(): Promise<void> {
        const settings = await this.prisma.backupSettings.findFirst();

        if (settings?.gdriveTokens) {
            try {
                const tokens = JSON.parse(decrypt(settings.gdriveTokens));
                const oauth2Client = await this.getOAuth2Client();
                if (oauth2Client && tokens.access_token) {
                    await oauth2Client.revokeToken(tokens.access_token);
                }
            } catch {
                // Ignore revocation errors
            }
        }

        await this.prisma.backupSettings.updateMany({
            data: {
                gdriveEnabled: false,
                gdriveTokens: null,
                gdriveEmail: null,
                gdriveConnectedAt: null,
            },
        });
    }

    /**
     * Save Google OAuth credentials (admin-configurable)
     */
    async saveCredentials(data: {
        clientId: string;
        clientSecret: string;
        redirectUri?: string;
    }): Promise<void> {
        const encryptedSecret = encrypt(data.clientSecret);

        await this.prisma.backupSettings.upsert({
            where: { id: 1 },
            update: {
                gdriveClientId: data.clientId,
                gdriveClientSecret: encryptedSecret,
                gdriveRedirectUri: data.redirectUri || 'http://localhost:3001/backup/cloud/callback',
                // Disconnect when credentials change
                gdriveEnabled: false,
                gdriveTokens: null,
                gdriveEmail: null,
                gdriveConnectedAt: null,
            },
            create: {
                autoBackup: false,
                gdriveClientId: data.clientId,
                gdriveClientSecret: encryptedSecret,
                gdriveRedirectUri: data.redirectUri || 'http://localhost:3001/backup/cloud/callback',
            },
        });
    }

    /**
     * Get current credentials configuration (without exposing secret)
     */
    async getCredentials(): Promise<{
        clientId: string | null;
        hasSecret: boolean;
        redirectUri: string | null;
    }> {
        const settings = await this.prisma.backupSettings.findFirst();
        return {
            clientId: settings?.gdriveClientId || null,
            hasSecret: !!settings?.gdriveClientSecret,
            redirectUri: settings?.gdriveRedirectUri || null,
        };
    }

    /**
     * Clear stored credentials
     */
    async clearCredentials(): Promise<void> {
        await this.prisma.backupSettings.updateMany({
            data: {
                gdriveClientId: null,
                gdriveClientSecret: null,
                gdriveRedirectUri: null,
                gdriveEnabled: false,
                gdriveTokens: null,
                gdriveEmail: null,
                gdriveConnectedAt: null,
            },
        });
    }

    /**
     * Ensure the backup folder exists in Google Drive
     */
    private async ensureBackupFolder(): Promise<string> {
        const drive = await this.getDriveClient();

        // Search for existing folder
        const response = await drive.files.list({
            q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
        });

        if (response.data.files && response.data.files.length > 0) {
            return response.data.files[0].id!;
        }

        // Create folder
        const folderMetadata = {
            name: FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
        };

        const folder = await drive.files.create({
            requestBody: folderMetadata,
            fields: 'id',
        });

        return folder.data.id!;
    }

    /**
     * Get authenticated Drive client
     */
    private async getDriveClient(): Promise<drive_v3.Drive> {
        const settings = await this.prisma.backupSettings.findFirst();

        if (!settings?.gdriveTokens) {
            throw new InternalServerErrorException('Google Drive not connected');
        }

        const tokens = JSON.parse(decrypt(settings.gdriveTokens));
        const oauth2Client = await this.getOAuth2Client();

        if (!oauth2Client) {
            throw new InternalServerErrorException('Google OAuth not configured');
        }

        oauth2Client.setCredentials(tokens);

        return google.drive({ version: 'v3', auth: oauth2Client });
    }

    /**
     * Upload a backup file to Google Drive
     */
    async uploadBackup(filename: string, type: 'database' | 'files'): Promise<{
        driveFileId: string;
        webViewLink: string;
    }> {
        const subDir = type === 'database' ? 'database' : 'files';
        const localPath = path.join(this.backupsDir, subDir, filename);

        if (!fs.existsSync(localPath)) {
            throw new NotFoundException(`Backup file not found: ${filename}`);
        }

        const drive = await this.getDriveClient();
        const folderId = await this.ensureBackupFolder();

        // Check if file already exists in Drive
        const existing = await this.prisma.cloudBackup.findUnique({
            where: { filename },
        });

        if (existing) {
            // Update existing file
            const response = await drive.files.update({
                fileId: existing.driveFileId,
                media: {
                    mimeType: 'application/octet-stream',
                    body: fs.createReadStream(localPath),
                },
                fields: 'id, webViewLink',
            });

            await this.prisma.cloudBackup.update({
                where: { filename },
                data: {
                    uploadedAt: new Date(),
                    size: BigInt(fs.statSync(localPath).size),
                },
            });

            return {
                driveFileId: response.data.id!,
                webViewLink: response.data.webViewLink || '',
            };
        }

        // Upload new file
        const stats = fs.statSync(localPath);
        const fileMetadata = {
            name: filename,
            parents: [folderId],
        };

        const media = {
            mimeType: 'application/octet-stream',
            body: fs.createReadStream(localPath),
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
        });

        // Store in database
        await this.prisma.cloudBackup.create({
            data: {
                filename,
                driveFileId: response.data.id!,
                driveWebLink: response.data.webViewLink,
                size: BigInt(stats.size),
                type,
            },
        });

        return {
            driveFileId: response.data.id!,
            webViewLink: response.data.webViewLink || '',
        };
    }

    /**
     * Check if a backup is synced to cloud
     */
    async isBackupSynced(filename: string): Promise<boolean> {
        const backup = await this.prisma.cloudBackup.findUnique({
            where: { filename },
        });
        return !!backup;
    }

    /**
     * Get list of cloud backups
     */
    async listCloudBackups(): Promise<Array<{
        filename: string;
        driveFileId: string;
        size: bigint;
        type: string;
        uploadedAt: Date;
    }>> {
        return this.prisma.cloudBackup.findMany({
            orderBy: { uploadedAt: 'desc' },
        });
    }

    /**
     * Delete a backup from cloud
     */
    async deleteCloudBackup(filename: string): Promise<void> {
        const backup = await this.prisma.cloudBackup.findUnique({
            where: { filename },
        });

        if (!backup) {
            return;
        }

        try {
            const drive = await this.getDriveClient();
            await drive.files.delete({ fileId: backup.driveFileId });
        } catch {
            // File might already be deleted from Drive
        }

        await this.prisma.cloudBackup.delete({
            where: { filename },
        });
    }

    /**
     * Get backup settings
     */
    async getSettings() {
        const settings = await this.prisma.backupSettings.findFirst();
        if (!settings) {
            return {
                autoBackup: false,
                backupTime: '02:00',
                retentionDays: 30,
                gdriveEnabled: false,
            };
        }
        return {
            autoBackup: settings.autoBackup,
            backupTime: settings.backupTime,
            retentionDays: settings.retentionDays,
            gdriveEnabled: settings.gdriveEnabled,
        };
    }

    /**
     * Update backup settings
     */
    async updateSettings(data: {
        autoBackup?: boolean;
        backupTime?: string;
        retentionDays?: number;
    }) {
        const existing = await this.prisma.backupSettings.findFirst();

        if (existing) {
            return this.prisma.backupSettings.update({
                where: { id: existing.id },
                data,
            });
        }

        return this.prisma.backupSettings.create({
            data: {
                autoBackup: data.autoBackup ?? false,
                backupTime: data.backupTime ?? '02:00',
                retentionDays: data.retentionDays ?? 30,
            },
        });
    }
}
