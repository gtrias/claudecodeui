// hooks/useVersionCheck.ts
import { useState, useEffect, useRef } from 'react';
import { version } from '../../package.json';

// Type definitions
interface ReleaseInfo {
  title: string;
  body: string;
  htmlUrl: string;
  publishedAt: string;
}

interface VersionCheckReturn {
  updateAvailable: boolean;
  latestVersion: string | null;
  currentVersion: string;
  releaseInfo: ReleaseInfo | null;
}

export const useVersionCheck = (owner: string, repo: string): VersionCheckReturn => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkVersion = async (): Promise<void> => {
      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
        const data = await response.json();

        // Handle the case where there might not be any releases
        if (data.tag_name) {
          const latest = data.tag_name.replace(/^v/, '');
          setLatestVersion(latest);
          setUpdateAvailable(version !== latest);

          // Store release information
          setReleaseInfo({
            title: data.name || data.tag_name,
            body: data.body || '',
            htmlUrl: data.html_url || `https://github.com/${owner}/${repo}/releases/latest`,
            publishedAt: data.published_at || new Date().toISOString(),
          });
        } else {
          // No releases found, don't show update notification
          setUpdateAvailable(false);
          setLatestVersion(null);
          setReleaseInfo(null);
        }
      } catch (error) {
        console.error('Version check failed:', error instanceof Error ? error.message : 'Unknown error');
        // On error, don't show update notification
        setUpdateAvailable(false);
        setLatestVersion(null);
        setReleaseInfo(null);
      }
    };

    checkVersion();
    intervalRef.current = setInterval(checkVersion, 5 * 60 * 1000); // Check every 5 minutes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [owner, repo]);

  return { updateAvailable, latestVersion, currentVersion: version, releaseInfo };
};

export default useVersionCheck;