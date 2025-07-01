// Variables globales
let qrLibraryLoaded = false;
let useAPIFallback = false;

// Referencias a elementos del DOM
const textInput = document.getElementById('textInput');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const outputSection = document.getElementById('outputSection');
const qrcodeDiv = document.getElementById('qrcode');

// Variable para almacenar el QR generado
let currentQRCode = null;

// Verificar si la biblioteca QRCode se cargó correctamente
function checkQRLibrary() {
    if (typeof QRCodeStyling !== 'undefined') {
        qrLibraryLoaded = true;
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generar QR';
        clearError();
        console.log('Biblioteca QRCodeStyling cargada correctamente');
    } else if (window.useAPIFallback) {
        qrLibraryLoaded = true;
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generar QR';
        clearError();
        console.log('Usando API fallback para generar QR');
    } else {
        qrLibraryLoaded = false;
        generateBtn.disabled = false; // Permitir intentar con API
        generateBtn.textContent = 'Generar QR (Básico)';
        showError('Usando generador básico. Para mejor calidad, verifica tu conexión a internet.');
        
        // Permitir usar el generador básico después de unos segundos
        setTimeout(() => {
            useAPIFallback = true;
            qrLibraryLoaded = true;
            generateBtn.textContent = 'Generar QR';
            clearError();
        }, 3000);
    }
}

// Event listeners
generateBtn.addEventListener('click', generateQR);
clearBtn.addEventListener('click', clearAll);
downloadBtn.addEventListener('click', downloadQR);

// Generar QR al presionar Enter en el textarea
textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        generateQR();
    }
});

// Función principal para generar el código QR
function generateQR() {
    const text = textInput.value.trim();
    
    // Validar que hay texto
    if (!text) {
        showError('Por favor, ingresa algún texto o URL para generar el código QR.');
        return;
    }
    
    // Limpiar errores previos
    clearError();
    
    // Mostrar estado de carga
    setLoadingState(true);
    
    // Limpiar QR anterior
    qrcodeDiv.innerHTML = '';
    
    // Intentar con la biblioteca principal
    if (typeof QRCodeStyling !== 'undefined') {
        generateWithQRCodeStyling(text);
    } else {
        // Usar API externa como fallback
        generateWithAPI(text);
    }
}

// Generar QR con QRCodeStyling
function generateWithQRCodeStyling(text) {
    try {
        const qrCode = new QRCodeStyling({
            width: 280,
            height: 280,
            type: "canvas",
            data: text,
            dotsOptions: {
                color: "#000000",
                type: "rounded"
            },
            backgroundOptions: {
                color: "#ffffff",
            },
            imageOptions: {
                crossOrigin: "anonymous",
            }
        });

        qrCode.append(qrcodeDiv);
        
        // Generar imagen para descarga
        qrCode.getRawData("png").then((blob) => {
            const reader = new FileReader();
            reader.onload = function() {
                currentQRCode = reader.result;
                setLoadingState(false);
                outputSection.style.display = 'block';
                outputSection.scrollIntoView({ behavior: 'smooth' });
                console.log('QR generado con QRCodeStyling');
            };
            reader.readAsDataURL(blob);
        });
        
    } catch (error) {
        console.error('Error con QRCodeStyling:', error);
        generateWithAPI(text);
    }
}

// Generar QR usando API externa (fallback)
function generateWithAPI(text) {
    try {
        // Usar API gratuita de QR Server
        const encodedText = encodeURIComponent(text);
        const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodedText}`;
        
        const img = document.createElement('img');
        img.src = qrURL;
        img.alt = 'Código QR generado';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = '10px';
        
        img.onload = function() {
            // Convertir a canvas para descarga
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            currentQRCode = canvas.toDataURL('image/png');
            
            setLoadingState(false);
            outputSection.style.display = 'block';
            outputSection.scrollIntoView({ behavior: 'smooth' });
            console.log('QR generado con API externa');
        };
        
        img.onerror = function() {
            setLoadingState(false);
            showError('Error al generar el código QR. Verifica tu conexión a internet.');
        };
        
        qrcodeDiv.appendChild(img);
        
    } catch (error) {
        setLoadingState(false);
        console.error('Error con API externa:', error);
        showError('Error al generar el código QR. Por favor, verifica tu conexión a internet.');
    }
}

// Función para limpiar todo
function clearAll() {
    textInput.value = '';
    qrcodeDiv.innerHTML = '';
    outputSection.style.display = 'none';
    currentQRCode = null;
    clearError();
    textInput.focus();
}

// Función para descargar el QR
function downloadQR() {
    if (!currentQRCode) {
        showError('No hay código QR para descargar.');
        return;
    }
    
    try {
        // Crear enlace de descarga
        const link = document.createElement('a');
        link.href = currentQRCode;
        link.download = `qr-code-${Date.now()}.png`;
        
        // Simular click para iniciar descarga
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Mostrar mensaje de éxito
        showSuccess('¡Código QR descargado exitosamente!');
        
    } catch (error) {
        console.error('Error al descargar:', error);
        showError('Hubo un error al descargar el código QR.');
    }
}

// Función para mostrar errores
function showError(message) {
    clearError();
    
    textInput.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    textInput.parentNode.insertBefore(errorDiv, textInput.nextSibling);
}

// Función para limpiar errores
function clearError() {
    textInput.classList.remove('error');
    
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
}

// Función para mostrar mensajes de éxito
function showSuccess(message) {
    clearError();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        color: #155724;
        font-size: 14px;
        margin-top: 10px;
        padding: 10px;
        background: #d4edda;
        border-radius: 8px;
        border: 1px solid #c3e6cb;
    `;
    successDiv.textContent = message;
    
    downloadBtn.parentNode.insertBefore(successDiv, downloadBtn.nextSibling);
    
    // Remover mensaje después de 3 segundos
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

// Función para manejar estado de carga
function setLoadingState(isLoading) {
    if (isLoading) {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generando...';
        generateBtn.classList.add('loading');
    } else {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generar QR';
        generateBtn.classList.remove('loading');
    }
}

// Función para validar URLs (opcional)
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Función para detectar y mejorar URLs
function processText(text) {
    // Si parece una URL pero no tiene protocolo, agregarlo
    if (text.includes('.') && !text.includes('://') && !text.includes(' ')) {
        if (text.startsWith('www.') || text.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            return 'https://' + text;
        }
    }
    return text;
}

// Mejorar la función generateQR para procesar URLs
const originalGenerateQR = generateQR;
generateQR = async function() {
    let text = textInput.value.trim();
    
    if (!text) {
        showError('Por favor, ingresa algún texto o URL para generar el código QR.');
        return;
    }
    
    // Procesar el texto para mejorar URLs
    text = processText(text);
    
    // Actualizar el textarea si se modificó el texto
    if (text !== textInput.value.trim()) {
        textInput.value = text;
    }
    
    // Continuar con la generación original
    return originalGenerateQR.call(this);
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    textInput.focus();
    
    // Verificar carga de la biblioteca QRCode inmediatamente
    checkQRLibrary();
    
    // Verificar nuevamente después de un tiempo
    setTimeout(() => {
        checkQRLibrary();
    }, 1000);
    
    // Permitir generación básica después de 3 segundos sin importar las bibliotecas
    setTimeout(() => {
        if (!qrLibraryLoaded) {
            useAPIFallback = true;
            qrLibraryLoaded = true;
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generar QR';
            clearError();
            console.log('Habilitando generación básica');
        }
    }, 3000);
    
    // Manejar paste events para URLs
    textInput.addEventListener('paste', (e) => {
        setTimeout(() => {
            const pastedText = textInput.value.trim();
            if (pastedText && (pastedText.startsWith('http') || pastedText.includes('.'))) {
                // Auto-generar QR para URLs pegadas
                setTimeout(() => {
                    generateQR();
                }, 500);
            }
        }, 100);
    });
});
