import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Slider,
    IconButton,
} from '@mui/material';
import {
    Crop as CropIcon,
    Close as CloseIcon,
    ZoomIn as ZoomInIcon,
} from '@mui/icons-material';

interface ImageCropDialogProps {
    open: boolean;
    imageFile: File | null;
    onClose: () => void;
    onCropComplete: (croppedBlob: Blob) => void;
    aspectRatio?: number; // e.g., 1 for square
    title?: string;
}

// Helper function to generate cropped image
async function getCroppedImg(
    image: HTMLImageElement,
    crop: PixelCrop,
    scale: number = 1
): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to the crop size
    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.imageSmoothingQuality = 'high';

    // Calculate the crop position in natural image coordinates
    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            },
            'image/png',
            1
        );
    });
}

// Center crop helper
function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

export default function ImageCropDialog({
    open,
    imageFile,
    onClose,
    onCropComplete,
    aspectRatio = 1,
    title = 'Crop Image',
}: ImageCropDialogProps) {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [scale, setScale] = useState(1);
    const [imgSrc, setImgSrc] = useState('');
    const imgRef = useRef<HTMLImageElement>(null);

    // Load image when file changes
    useState(() => {
        if (imageFile) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImgSrc(reader.result?.toString() || '');
            });
            reader.readAsDataURL(imageFile);
        }
    });

    // Set initial crop when image loads
    const onImageLoad = useCallback(
        (e: React.SyntheticEvent<HTMLImageElement>) => {
            const { width, height } = e.currentTarget;
            setCrop(centerAspectCrop(width, height, aspectRatio));
        },
        [aspectRatio]
    );

    // Handle apply crop
    const handleApply = async () => {
        if (!imgRef.current || !completedCrop) {
            return;
        }

        try {
            const croppedBlob = await getCroppedImg(imgRef.current, completedCrop, scale);
            onCropComplete(croppedBlob);
            handleClose();
        } catch (error) {
            console.error('Error cropping image:', error);
        }
    };

    // Handle close
    const handleClose = () => {
        setCrop(undefined);
        setCompletedCrop(undefined);
        setScale(1);
        setImgSrc('');
        onClose();
    };

    // Update image source when file changes
    if (imageFile && !imgSrc) {
        const reader = new FileReader();
        reader.onload = () => {
            setImgSrc(reader.result?.toString() || '');
        };
        reader.readAsDataURL(imageFile);
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { maxHeight: '90vh' },
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CropIcon color="primary" />
                <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
                    {title}
                </Typography>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Instructions */}
                    <Typography variant="body2" color="text.secondary">
                        Drag to reposition the crop area. Use the handles to resize.
                    </Typography>

                    {/* Zoom slider */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2 }}>
                        <ZoomInIcon color="action" />
                        <Typography variant="body2" minWidth={50}>
                            Zoom
                        </Typography>
                        <Slider
                            value={scale}
                            min={0.5}
                            max={3}
                            step={0.1}
                            onChange={(_, value) => setScale(value as number)}
                            sx={{ flexGrow: 1, maxWidth: 200 }}
                        />
                        <Typography variant="body2" color="text.secondary" minWidth={40}>
                            {Math.round(scale * 100)}%
                        </Typography>
                    </Box>

                    {/* Image crop area */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 300,
                            maxHeight: 500,
                            overflow: 'hidden',
                            backgroundColor: 'grey.100',
                            borderRadius: 2,
                            p: 2,
                        }}
                    >
                        {imgSrc ? (
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={aspectRatio}
                                circularCrop={false}
                            >
                                <img
                                    ref={imgRef}
                                    alt="Crop preview"
                                    src={imgSrc}
                                    style={{
                                        transform: `scale(${scale})`,
                                        maxHeight: '400px',
                                        maxWidth: '100%',
                                        objectFit: 'contain',
                                    }}
                                    onLoad={onImageLoad}
                                />
                            </ReactCrop>
                        ) : (
                            <Typography color="text.secondary">Loading image...</Typography>
                        )}
                    </Box>

                    {/* Preview hint */}
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                        The cropped logo will maintain its aspect ratio for display in the header.
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={handleApply}
                    variant="contained"
                    disabled={!completedCrop}
                    startIcon={<CropIcon />}
                >
                    Apply Crop
                </Button>
            </DialogActions>
        </Dialog>
    );
}
