import React, { useState, useRef, useEffect } from "react";
import AdminLayout from "@/app/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Camera,
  User,
  Search,
  Upload,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
  Brain,
} from "lucide-react";
import { useFacialRecognition } from "@/hooks/use-facial-recognition";
import { useToast } from "@/hooks/use-toast";

const ReconocimientoFacial: React.FC = () => {
  const {
    isIdentifying,
    isLoadingStats,
    isRebuilding,
    identificationResult,
    databaseStats,
    identifyFace,
    loadDatabaseStats,
    rebuildDatabase,
    clearIdentificationResult,
  } = useFacialRecognition();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const { toast } = useToast();

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    loadDatabaseStats();
  }, [loadDatabaseStats]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo acceder a la cámara",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], "captured_photo.jpg", {
                type: "image/jpeg",
              });
              setSelectedImage(file);
              setPreviewUrl(URL.createObjectURL(blob));
              clearIdentificationResult();
              stopCamera();
            }
          },
          "image/jpeg",
          0.8
        );
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      clearIdentificationResult();
    }
  };

  const handleIdentifyFace = async () => {
    if (!selectedImage) {
      toast({
        title: "Error",
        description: "Selecciona una imagen primero",
        variant: "destructive",
      });
      return;
    }

    await identifyFace(selectedImage);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl("");
    clearIdentificationResult();
    stopCamera();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reconocimiento Facial</h1>
            <p className="text-gray-600 mt-1">
              Sistema de identificación con DeepFace (local)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadDatabaseStats}
              disabled={isLoadingStats}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoadingStats ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>
            <Button
              onClick={rebuildDatabase}
              disabled={isRebuilding}
              variant="outline"
              size="sm"
            >
              <Database className="h-4 w-4 mr-2" />
              {isRebuilding ? "Reconstruyendo..." : "Rebuild Cache"}
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        {databaseStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {databaseStats.total_residents}
                </div>
                <p className="text-sm text-gray-600">Residentes registrados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {databaseStats.total_images}
                </div>
                <p className="text-sm text-gray-600">Imágenes en la BD</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      databaseStats.cache_exists ? "default" : "destructive"
                    }
                  >
                    {databaseStats.cache_exists ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">Estado del caché</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">{databaseStats.model}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Modelo: {databaseStats.detector}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Captura de imagen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Captura de Imagen
              </CardTitle>
              <CardDescription>
                Sube una foto o captura desde la cámara
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cámara web */}
              {!previewUrl && (
                <div className="space-y-2">
                  <Label>Cámara Web</Label>
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                      autoPlay
                      playsInline
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {!isCameraActive ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button onClick={startCamera} size="lg">
                          <Camera className="h-5 w-5 mr-2" />
                          Activar Cámara
                        </Button>
                      </div>
                    ) : (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                        <Button onClick={capturePhoto} size="sm">
                          <Camera className="h-4 w-4 mr-2" />
                          Capturar
                        </Button>
                        <Button
                          onClick={stopCamera}
                          size="sm"
                          variant="outline"
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subir archivo */}
              {!previewUrl && (
                <div className="space-y-2">
                  <Label>O subir archivo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                </div>
              )}

              {/* Preview */}
              {previewUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Vista previa</Label>
                    <Button
                      onClick={clearImage}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Limpiar
                    </Button>
                  </div>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                </div>
              )}

              {/* Botón de identificación */}
              <Button
                onClick={handleIdentifyFace}
                disabled={!selectedImage || isIdentifying}
                className="w-full"
                size="lg"
              >
                {isIdentifying ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Identificando...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Identificar Persona
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Resultados de Identificación
              </CardTitle>
            </CardHeader>
            <CardContent>
              {identificationResult ? (
                identificationResult.success &&
                identificationResult.residente_id ? (
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <AlertDescription className="ml-2">
                        <span className="font-semibold text-green-900">
                          ✅ Persona identificada exitosamente
                        </span>
                      </AlertDescription>
                    </Alert>

                    {/* Información del residente */}
                    {identificationResult.residente && (
                      <div className="p-6 border rounded-lg bg-white shadow-sm space-y-4">
                        {/* Header con foto y nombre */}
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {identificationResult.residente.foto_perfil ? (
                              <img
                                src={identificationResult.residente.foto_perfil}
                                alt={identificationResult.residente.nombre_completo}
                                className="w-20 h-20 rounded-full object-cover border-2 border-green-500"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-green-500">
                                <User className="h-10 w-10 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">
                              {identificationResult.residente.nombre_completo}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              CI: {identificationResult.residente.ci}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant={
                                  identificationResult.residente.estado === 'activo'
                                    ? 'default'
                                    : identificationResult.residente.estado === 'suspendido'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {identificationResult.residente.estado.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {identificationResult.residente.tipo}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Información detallada */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Email</p>
                            <p className="text-sm font-medium text-gray-900">
                              {identificationResult.residente.email || 'No especificado'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                            <p className="text-sm font-medium text-gray-900">
                              {identificationResult.residente.telefono || 'No especificado'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Unidad</p>
                            <p className="text-sm font-medium text-gray-900">
                              {identificationResult.residente.unidad_habitacional
                                ? `Unidad #${identificationResult.residente.unidad_habitacional}`
                                : 'No asignada'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Acceso</p>
                            <p className="text-sm font-medium text-gray-900">
                              {identificationResult.residente.puede_acceder ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4" />
                                  Permitido
                                </span>
                              ) : (
                                <span className="text-red-600 flex items-center gap-1">
                                  <XCircle className="h-4 w-4" />
                                  Denegado
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Métricas de confianza */}
                    <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Confianza:
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all"
                              style={{
                                width: `${
                                  (identificationResult.confidence || 0) * 100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="font-bold text-green-600">
                            {Math.round(
                              (identificationResult.confidence || 0) * 100
                            )}
                            %
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Servicio:
                        </span>
                        <Badge variant="outline">
                          <Brain className="h-3 w-3 mr-1" />
                          {identificationResult.service || "DeepFace"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Modelo:
                        </span>
                        <Badge variant="outline">
                          {identificationResult.model || "Facenet"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <AlertDescription className="ml-2">
                      <span className="font-semibold text-red-900">
                        ❌ No se pudo identificar
                      </span>
                      <p className="text-sm text-red-700 mt-1">
                        {identificationResult.message ||
                          "Rostro no registrado o confianza insuficiente"}
                      </p>
                    </AlertDescription>
                  </Alert>
                )
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Selecciona una imagen para comenzar</p>
                  <p className="text-sm mt-1">
                    La identificación usa el modelo {databaseStats?.model ||
                      "Facenet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Características:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>✅ Reconocimiento facial local (sin internet)</li>
                  <li>✅ Modelo: {databaseStats?.model || "Facenet"}</li>
                  <li>✅ Detector: {databaseStats?.detector || "opencv"}</li>
                  <li>
                    ✅ Procesamiento: ~2s con caché, ~30s sin caché (primera
                    vez)
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  Cómo agregar residentes:
                </h4>
                <ul className="space-y-1 text-gray-600">
                  <li>
                    1. Subir foto a{" "}
                    <code className="bg-gray-100 px-1 rounded">
                      media/rostros/&#123;CI&#125;/perfil.jpg
                    </code>
                  </li>
                  <li>
                    2. Hacer clic en "Rebuild Cache" para actualizar la base de
                    datos
                  </li>
                  <li>3. Listo para identificar</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ReconocimientoFacial;
