'use client'

import React from 'react'
import { ExternalLink } from 'lucide-react'
import ExternalImg from '@/components/ExternalImg'
import { SocialPost, PLATFORM_CONFIG } from './types'

interface SocialPostMediaViewerProps {
  post: SocialPost
  boutiqueNom: string
}

function getRenderableEmbedHtml(post: SocialPost): string {
  if (!post.embed_html) return ''

  if (post.plateforme === 'facebook' && (post.embed_html.includes('fb-post') || !post.embed_html.includes('<iframe'))) {
    const url = post.post_url
    const isVideoOrReel = /\/(reel|videos|watch)/i.test(url)
    const isPage = !isVideoOrReel && !/\/(posts|photos|story\.php|permalink\.php)/i.test(url)

    let fbPluginUrl = ''
    if (isVideoOrReel) {
      fbPluginUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&width=380&show_text=true&appId=`
    } else if (isPage) {
      fbPluginUrl = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(url)}&tabs=timeline&width=380&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId=`
    } else {
      fbPluginUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&width=380&show_text=true&appId=`
    }

    return `<iframe src="${fbPluginUrl}" width="100%" height="480" style="border:none;overflow:hidden;border-radius:12px;background:#ffffff;" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`
  }

  return post.embed_html
}

export default function SocialPostMediaViewer({ post, boutiqueNom }: SocialPostMediaViewerProps) {
  const conf = PLATFORM_CONFIG[post.plateforme] || PLATFORM_CONFIG.tiktok
  const PlatformIcon = conf.IconComponent

  return (
    <div
      style={{
        flex: '1 1 420px',
        background: '#090d16',
        minHeight: 380,
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflowY: 'auto',
      }}
    >
      {post.embed_html ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              minHeight: 460,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: post.plateforme === 'tiktok' || post.plateforme === 'facebook' ? '#ffffff' : 'transparent',
              borderRadius: post.plateforme === 'tiktok' || post.plateforme === 'facebook' ? 12 : 0,
              overflow: 'hidden',
              padding: post.plateforme === 'tiktok' || post.plateforme === 'facebook' ? '8px 4px' : 0,
            }}
            dangerouslySetInnerHTML={{ __html: getRenderableEmbedHtml(post) }}
          />
          <div style={{ padding: '8px 12px', textAlign: 'center' }}>
            <a
              href={post.post_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: post.plateforme === 'tiktok' ? '#38bdf8' : '#94a3b8',
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>Ouvrir sur {conf.label}</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      ) : post.thumbnail_url ? (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 400 }}>
          <ExternalImg src={post.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <a
            href={post.post_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.92)',
              color: '#0f172a',
              padding: '10px 18px',
              borderRadius: 24,
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            }}
          >
            <span>Ouvrir sur {post.plateforme}</span>
            <ExternalLink size={14} />
          </a>
        </div>
      ) : (
        <div
          style={{
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: '#fff',
            width: '100%',
            height: '100%',
            minHeight: 380,
            background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background:
                post.plateforme === 'instagram'
                  ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                  : post.plateforme === 'tiktok'
                  ? '#000000'
                  : '#1877f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            <PlatformIcon size={28} />
          </div>
          <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 900, color: '#ffffff' }}>
            {post.auteur || `@${boutiqueNom}`}
          </h4>
          <p style={{ margin: '0 0 20px', fontSize: 12.5, color: '#94a3b8', maxWidth: 280, lineHeight: 1.4 }}>
            {post.caption || `Découvrez nos publications officielles sur ${post.plateforme.toUpperCase()}.`}
          </p>
          <a
            href={post.post_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background:
                post.plateforme === 'instagram'
                  ? 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)'
                  : '#2563eb',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: 24,
              fontWeight: 800,
              fontSize: 13,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <span>Voir sur {post.plateforme}</span>
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  )
}
