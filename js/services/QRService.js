class QRService {
    constructor(qrElement) {
        this.qrElement = qrElement;
        this.qrInstance = null;
    }

    generateQRCode(data) {
        // Clear previous QR code
        if (this.qrElement) {
            this.qrElement.innerHTML = '';
        }
        
        // Create new QR code
        this.qrInstance = new QRCode(this.qrElement, {
            text: typeof data === 'string' ? data : JSON.stringify(data),
            width: 200,
            height: 200,
            colorDark: "#0070ba",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        return this.qrInstance;
    }

    parseQRCode(data) {
        try {
            // In a real app, this would be data from scanning a QR code
            return JSON.parse(data);
        } catch (error) {
            throw new Error('Invalid QR code data');
        }
    }
}
