import {isSazka, isLocal} from './config-getters'

export default function apiUrl(url: string): string {
	url = url.trim()
	// trim slashes
	url = url.replace(/^\/|\/$/g, '')

	if (isLocal()) {
		return `http://localhost:8070/api/public/cli/${url}`
	}

	return isSazka() ? `https://sazka.imagelance.com/api/public/cli/${url}` : `https://api.app.imagelance.com/api/public/cli/${url}`
}