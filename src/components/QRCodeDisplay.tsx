import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  title?: string;
}

export const QRCodeDisplay = ({ value, size = 256, title }: QRCodeDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (error) => {
          if (error) {
            console.error("QR Code generation error:", error);
          } else {
            setQrGenerated(true);
          }
        }
      );
    }
  }, [value, size]);

  const handleDownload = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `qr-code-${title || "complaint"}.png`;
          a.click();
          URL.revokeObjectURL(url);
          
          toast({
            title: "QR Code Downloaded",
            description: "QR code saved successfully",
          });
        }
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="border rounded-lg p-4 bg-white" />
      {qrGenerated && (
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download QR Code
        </Button>
      )}
    </div>
  );
};
