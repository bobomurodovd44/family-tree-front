"use client"

import { useCallback, useState } from "react"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"

interface ImageCropperProps {
  imageSrc: string
  aspect?: number
  onCropComplete: (croppedBlob: Blob) => void
  onCancel: () => void
}

/** Helper to draw the cropped area on a canvas and return a Blob. */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob | null> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.addEventListener("load", () => resolve(img))
    img.addEventListener("error", (error) => reject(error))
    img.src = imageSrc
  })

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    return null
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, "image/jpeg", 0.95)
  })
}

export function ImageCropper({
  imageSrc,
  aspect = 3 / 4,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const t = useTranslations("People")
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  const onCropCompleteInternal = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setIsCropping(true)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (blob) {
        onCropComplete(blob)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsCropping(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[60vh] w-full min-h-[300px] overflow-hidden rounded-md bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={setZoom}
        />
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground w-12 text-right">{t("zoom")}</span>
        <input
          type="range"
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          aria-labelledby="Zoom"
          onChange={(e) => {
            setZoom(Number(e.target.value))
          }}
          className="w-full flex-1"
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="button" onClick={handleSave} disabled={isCropping}>
          {isCropping ? t("cropping") : t("applyCrop")}
        </Button>
      </div>
    </div>
  )
}
