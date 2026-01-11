import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'GeoGuard Attendance',
        short_name: 'GeoGuard',
        description: 'Secure GPS & Device-Locked Attendance System',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
            {
                src: '/icon.png', // Next.js will serve the file at app/icon.png as /icon.png?v=...
                sizes: 'any',
                type: 'image/png',
            },
        ],
    }
}
