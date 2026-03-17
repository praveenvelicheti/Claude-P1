import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Photo } from '../types/database'

export function usePhotos(galleryId?: string) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!galleryId) { setLoading(false); return }
    fetchPhotos()
  }, [galleryId])

  async function fetchPhotos() {
    setLoading(true)
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('gallery_id', galleryId!)
      .order('position', { ascending: true })
    setPhotos((data ?? []) as Photo[])
    setLoading(false)
  }

  async function addPhoto(photo: Omit<Photo, 'id' | 'created_at'>): Promise<Photo> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from('photos')
      .insert(photo as any)
      .select()
      .single()
    if (error) throw error
    const created = data as Photo
    setPhotos(prev => [...prev, created])
    return created
  }

  async function deletePhoto(id: string) {
    const { error } = await supabase.from('photos').delete().eq('id', id)
    if (error) throw error
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  return { photos, loading, addPhoto, deletePhoto, refetch: fetchPhotos }
}
