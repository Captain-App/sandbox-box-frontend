import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Shipbox Documentation',
			social: {
				github: 'https://github.com/crew/shipbox-dev',
			},
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', link: '/' },
						{ label: 'Quickstart', link: '/guides/quickstart' },
					],
				},
				{
					label: 'Features',
					items: [
						{ label: 'Dashboard', link: '/features/dashboard' },
						{ label: 'Workspace', link: '/features/workspace' },
						{ label: 'Settings', link: '/features/settings' },
						{ label: 'Billing', link: '/features/billing' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Creating Sandboxes', link: '/guides/creating-sandbox' },
						{ label: 'Autonomous Mode', link: '/guides/autonomous-mode' },
					],
				},
				{
					label: 'API Reference',
					items: [
						{ label: 'Overview', link: '/api/overview' },
						{ label: 'Endpoints', link: '/api/endpoints' },
					],
				},
			],
		}),
	],
});
