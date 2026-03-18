import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Gallery } from '../types/database'

export function useGalleries(photographerId?: string) {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [totalPhotoCount, setTotalPhotoCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!photographerId) { setLoading(false); return }
    fetchGalleries()
  }, [photographerId])

  async function fetchGalleries() {
    setLoading(true)
    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('photographer_id', photographerId!)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else {
      const fetched = (data ?? []) as Gallery[]
      setGalleries(fetched)
      if (fetched.length > 0) {
        const { count } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .in('gallery_id', fetched.map(g => g.id))
        setTotalPhotoCount(count ?? 0)
      } else {
        setTotalPhotoCount(0)
      }
    }
    setLoading(false)
  }

  async function createGallery(gallery: Omit<Gallery, 'id' | 'created_at' | 'updated_at' | 'view_count'>): Promise<Gallery> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from('galleries')
      .insert(gallery as any)
      .select()
      .single()
    if (error) throw error
    const created = data as Gallery
    setGalleries(prev => [created, ...prev])
    return created
  }

  async function updateGallery(id: string, updates: Partial<Gallery>): Promise<Gallery> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from('galleries')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const updated = data as Gallery
    setGalleries(prev => prev.map(g => g.id === id ? updated : g))
    return updated
  }

  async function deleteGallery(id: string) {
    const { error } = await supabase.from('galleries').delete().eq('id', id)
    if (error) throw error
    setGalleries(prev => prev.filter(g => g.id !== id))
  }

  async function getGalleryBySlug(slug: string): Promise<Gallery> {
    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('slug', slug)
      .single()
    if (error) throw error
    return data as Gallery
  }

  return { galleries, totalPhotoCount, loading, error, createGallery, updateGallery, deleteGallery, getGalleryBySlug, refetch: fetchGalleries }
}
