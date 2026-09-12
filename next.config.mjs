const onGitHubPages = process.env.GITHUB_ACTIONS === 'true';

/** @type {import('next').NextConfig} */
const config = {
  output: onGitHubPages ? 'export' : undefined,
  basePath: onGitHubPages ? '/sdxl-tag-gacha' : '',
  assetPrefix: onGitHubPages ? '/sdxl-tag-gacha/' : undefined,
  trailingSlash: onGitHubPages,
};

export default config;
