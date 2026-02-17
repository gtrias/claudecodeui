import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";

export function useMigrateSettings() {
  const { isAuthenticated } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const migrationStatus = useQuery(
    api.settings.checkMigrationStatus,
    isAuthenticated ? {} : "skip"
  );
  const migrateSettings = useMutation(api.settings.migrateSettings);

  useEffect(() => {
    async function runMigration() {
      if (!isAuthenticated) return;
      if (migrationStatus === undefined) return; // Still loading
      if (migrationStatus.migrated) return; // Already done
      if (migrating) return; // Already in progress

      setMigrating(true);
      setError(null);

      try {
        // Fetch SQLite data from Express
        const response = await fetch("/api/migrate/settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings from server");
        }

        const { data } = await response.json();

        // Migrate to Convex
        await migrateSettings({
          apiKeys: data.apiKeys || [],
          credentials: data.credentials || [],
          modelSettings: data.modelSettings,
        });

        console.log("Settings migration complete");
      } catch (err) {
        console.error("Migration error:", err);
        setError(err instanceof Error ? err.message : "Migration failed");
      } finally {
        setMigrating(false);
      }
    }

    runMigration();
  }, [isAuthenticated, migrationStatus, migrating, migrateSettings]);

  return { migrating, error, migrated: migrationStatus?.migrated || false };
}
