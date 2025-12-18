import { useState, useRef } from 'react';
import { Camera, Upload, X, Car, AlertCircle, CheckCircle2, User, Home, Phone, Mail } from 'lucide-react';
import AdminLayout from '@/app/layout/admin-layout';
import { usePlateRecognition } from '@/hooks/use-plate-recognition';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function ReconocimientoPlacasPage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isLoading, result, error, recognizePlate, reset } = usePlateRecognition();

  // Iniciar c\u00e1mara
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      reset();
    } catch (err) {
      console.error('Error al iniciar c\u00e1mara:', err);
      alert('No se pudo acceder a la c\u00e1mara');
    }
  };

  // Detener c\u00e1mara
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Capturar foto
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    stopCamera();
  };

  // Subir imagen desde archivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string);
      reset();
    };
    reader.readAsDataURL(file);
  };

  // Procesar imagen
  const handleRecognize = async () => {
    if (!capturedImage) return;
    await recognizePlate(capturedImage);
  };

  // Limpiar todo
  const handleClear = () => {
    setCapturedImage(null);
    reset();
    stopCamera();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reconocimiento de Placas</h1>
          <p className="text-muted-foreground mt-1">
            Identifica veh\u00edculos mediante OCR de placas vehiculares
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Panel de captura */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Captura de Imagen
            </h2>

            {/* Video preview */}
            {isCameraActive && (
              <div className="relative mb-4 bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                  <Button onClick={capturePhoto} size="lg">
                    <Camera className="mr-2 h-5 w-5" />
                    Capturar Placa
                  </Button>
                  <Button onClick={stopCamera} variant="destructive" size="lg">
                    <X className="mr-2 h-5 w-5" />
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Imagen capturada */}
            {capturedImage && !isCameraActive && (
              <div className="mb-4 relative">
                <img
                  src={capturedImage}
                  alt="Imagen capturada"
                  className="w-full rounded-lg border"
                />
                <Button
                  onClick={handleClear}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Botones de acci\u00f3n */}
            {!isCameraActive && !capturedImage && (
              <div className="space-y-3">
                <Button onClick={startCamera} className="w-full" size="lg">
                  <Camera className="mr-2 h-5 w-5" />
                  Activar C\u00e1mara
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O</span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Subir Imagen
                </Button>
              </div>
            )}

            {/* Bot\u00f3n de reconocimiento */}
            {capturedImage && !isCameraActive && (
              <Button
                onClick={handleRecognize}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>Procesando imagen...</>
                ) : (
                  <>
                    <Car className="mr-2 h-5 w-5" />
                    Identificar Placa
                  </>
                )}
              </Button>
            )}
          </Card>

          {/* Panel de resultados */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Car className="h-5 w-5" />
              Resultados del OCR
            </h2>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!result && !error && (
              <div className="text-center py-12 text-muted-foreground">
                <Car className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Los resultados aparecer\u00e1n aqu\u00ed</p>
                <p className="text-sm mt-2">
                  Captura o sube una imagen de una placa vehicular
                </p>
              </div>
            )}

            {result && result.success && (
              <div className="space-y-4">
                {/* Placa detectada */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Placa Detectada</span>
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Identificada
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold tracking-wider text-center py-2 bg-yellow-400 text-black rounded-md">
                    {result.plate}
                  </div>
                </div>

                {/* Confianza */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confianza del OCR</span>
                    <span className="font-semibold">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={result.confidence * 100} className="h-2" />
                </div>

                <Separator />

                {/* Informaci\u00f3n del veh\u00edculo */}
                {result.vehiculo ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={result.vehiculo.foto_vehiculo || undefined}
                          alt={`${result.vehiculo.marca} ${result.vehiculo.modelo}`}
                        />
                        <AvatarFallback className="bg-blue-500 text-white text-xl">
                          <Car className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {result.vehiculo.marca} {result.vehiculo.modelo}
                        </h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={result.vehiculo.estado === 'activo' ? 'default' : 'secondary'}>
                            {result.vehiculo.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Badge variant="outline">{result.vehiculo.tipo_vehiculo}</Badge>
                          <Badge variant="outline">{result.vehiculo.color}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">A\u00f1o:</span>
                        <p className="font-medium">{result.vehiculo.anio}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tipo:</span>
                        <p className="font-medium capitalize">{result.vehiculo.tipo_vehiculo}</p>
                      </div>
                    </div>

                    {result.vehiculo.residente && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Propietario Registrado
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {result.vehiculo.residente.nombre} {result.vehiculo.residente.apellido}
                              </span>
                            </div>
                            {result.vehiculo.residente.unidad && (
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  Unidad {result.vehiculo.residente.unidad.numero_unidad} -{' '}
                                  Bloque {result.vehiculo.residente.unidad.bloque}
                                </span>
                              </div>
                            )}
                            {result.vehiculo.residente.ci && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">CI:</span>
                                <span className="font-medium">{result.vehiculo.residente.ci}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      La placa <strong>{result.plate}</strong> no est\u00e1 registrada en la base de datos
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {result && !result.success && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
