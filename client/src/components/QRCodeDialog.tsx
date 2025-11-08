import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeDialogProps {
  url: string;
  title: string;
}

export default function QRCodeDialog({ url, title }: QRCodeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 1000;
    canvas.height = 1000;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 1000, 1000);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `${title.replace(/\s+/g, "-").toLowerCase()}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-qr-code">
          <QrCode className="h-4 w-4" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription>
            Scan this code to share your link-in-bio profile
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-6">
          <div className="bg-white p-6 rounded-lg">
            <QRCodeSVG
              id="qr-code-svg"
              value={url}
              size={256}
              level="H"
              includeMargin={true}
              data-testid="qr-code-display"
            />
          </div>
          <div className="flex gap-3 w-full">
            <Button
              onClick={downloadQRCode}
              className="flex-1"
              data-testid="button-download-qr"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              data-testid="button-close-qr"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
