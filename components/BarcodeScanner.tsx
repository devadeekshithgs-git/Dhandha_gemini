import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        // Initialize the scanner
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        // Responsive Calculations
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const isMobile = screenWidth < 768;

        // Calculate dynamic QR/Barcode box size
        // For mobile, we want a larger scan area relative to screen width
        const boxSize = Math.min(screenWidth, screenHeight) * (isMobile ? 0.7 : 0.5);

        const config = {
            fps: 10,
            qrbox: { width: boxSize, height: boxSize / (isMobile ? 1.5 : 2) }, // Rectangular mostly for barcodes
            aspectRatio: isMobile ? screenWidth / screenHeight : 1.0
        };

        // Prefer back camera
        html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                // Success callback
                if (navigator.vibrate) navigator.vibrate(200);

                html5QrCode.stop().then(() => {
                    onScanSuccess(decodedText);
                }).catch(err => {
                    console.error("Failed to stop scanner", err);
                    onScanSuccess(decodedText);
                });
            },
            (errorMessage) => {
                // Error callback - silent
            }
        ).catch(err => {
            console.error("Error starting scanner", err);
            setError("Could not start camera. Please ensure you have given permission.");
        });

        // Cleanup
        return () => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(err => console.error("Failed to stop scanner on cleanup", err));
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
            <div className="absolute top-4 right-4 z-50">
                <button onClick={() => {
                    if (scannerRef.current?.isScanning) {
                        scannerRef.current.stop().then(onClose);
                    } else {
                        onClose();
                    }
                }} className="bg-white/20 p-2 rounded-full text-white backdrop-blur-md">
                    <X size={24} />
                </button>
            </div>

            <div className="w-full max-w-md px-4 h-full flex flex-col justify-center">
                <div id="reader" className="overflow-hidden rounded-2xl bg-black border border-slate-700 w-full"></div>

                {error && (
                    <div className="mt-4 p-3 bg-red-900/50 border border-red-500/50 text-red-200 text-sm rounded-lg text-center">
                        {error}
                        <button onClick={onClose} className="block w-full mt-2 py-1 bg-red-600 rounded text-white font-bold text-xs">
                            Close
                        </button>
                    </div>
                )}

                <p className="text-center text-slate-400 mt-6 text-sm font-medium bg-black/40 py-2 rounded-full">
                    Point camera at a barcode
                </p>
            </div>
        </div>
    );
};

export default BarcodeScanner;
