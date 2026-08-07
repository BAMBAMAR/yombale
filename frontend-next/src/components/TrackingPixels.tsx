'use client'
import { useEffect } from 'react'

interface TrackingPixelsProps {
  metaPixelId?: string | null
  tiktokPixelId?: string | null
  ga4Id?: string | null
}

declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: Record<string, unknown>) => void
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void }
    gtag?: (command: string, action: string, params?: Record<string, unknown>) => void
    dataLayer?: Record<string, unknown>[]
  }
}

export default function TrackingPixels({ metaPixelId, tiktokPixelId, ga4Id }: TrackingPixelsProps) {
  useEffect(() => {
    // 1. Meta Facebook Pixel
    if (metaPixelId && typeof window !== 'undefined') {
      if (!window.fbq) {
        /* eslint-disable */
        // @ts-ignore
        (function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})
        (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        /* eslint-enable */
      }
      if (window.fbq) {
        window.fbq('init', metaPixelId)
        window.fbq('track', 'PageView')
      }
    }

    // 2. TikTok Pixel
    if (tiktokPixelId && typeof window !== 'undefined') {
      if (!window.ttq) {
        /* eslint-disable */
        // @ts-ignore
        (function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        ttq.load(tiktokPixelId);
        ttq.page();
        /* eslint-enable */
      }
    }

    // 3. Google Analytics GA4
    if (ga4Id && typeof window !== 'undefined') {
      const scriptId = 'ga4-script'
      if (!document.getElementById(scriptId)) {
        const s = document.createElement('script')
        s.id = scriptId
        s.async = true
        s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`
        document.head.appendChild(s)

        window.dataLayer = window.dataLayer || []
        window.gtag = function() {
          // eslint-disable-next-line prefer-rest-params
          window.dataLayer!.push(arguments as unknown as Record<string, unknown>)
        }
        window.gtag('js', 'new Date()')
        window.gtag('config', ga4Id)
      }
    }
  }, [metaPixelId, tiktokPixelId, ga4Id])

  return null
}
