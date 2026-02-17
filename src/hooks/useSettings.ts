import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

// ============ API Keys ============

export function useApiKeys() {
  const { isAuthenticated } = useAuth();

  const apiKeys = useQuery(api.settings.getApiKeys, isAuthenticated ? {} : "skip");
  const createApiKeyMutation = useMutation(api.settings.createApiKey);
  const deleteApiKeyMutation = useMutation(api.settings.deleteApiKey);
  const toggleApiKeyMutation = useMutation(api.settings.toggleApiKey);

  return {
    apiKeys: apiKeys || [],
    isLoading: apiKeys === undefined,
    createApiKey: async (name: string) => {
      return await createApiKeyMutation({ name });
    },
    deleteApiKey: async (id: string) => {
      return await deleteApiKeyMutation({ id: id as Id<"apiKeys"> });
    },
    toggleApiKey: async (id: string, isActive: boolean) => {
      return await toggleApiKeyMutation({ id: id as Id<"apiKeys">, isActive });
    },
  };
}

// ============ Credentials ============

export function useCredentials(type?: string) {
  const { isAuthenticated } = useAuth();

  const queryArgs = type !== undefined ? { type } : {};
  const credentials = useQuery(
    api.settings.getCredentials,
    isAuthenticated ? queryArgs : "skip"
  );
  const createCredentialMutation = useMutation(api.settings.createCredential);
  const updateCredentialMutation = useMutation(api.settings.updateCredential);
  const deleteCredentialMutation = useMutation(api.settings.deleteCredential);
  const toggleCredentialMutation = useMutation(api.settings.toggleCredential);

  return {
    credentials: credentials || [],
    isLoading: credentials === undefined,
    createCredential: async (data: {
      type: string;
      name: string;
      value: string;
      description?: string;
    }) => {
      return await createCredentialMutation(data);
    },
    updateCredential: async (id: string, value: string) => {
      return await updateCredentialMutation({ id: id as Id<"credentials">, value });
    },
    deleteCredential: async (id: string) => {
      return await deleteCredentialMutation({ id: id as Id<"credentials"> });
    },
    toggleCredential: async (id: string, isActive: boolean) => {
      return await toggleCredentialMutation({
        id: id as Id<"credentials">,
        isActive,
      });
    },
  };
}

export function useActiveCredential(type: string) {
  const { isAuthenticated } = useAuth();

  const value = useQuery(
    api.settings.getActiveCredential,
    isAuthenticated ? { type } : "skip"
  );

  return {
    value,
    isLoading: value === undefined,
  };
}

// ============ Model Settings ============

export function useModelSettings() {
  const { isAuthenticated } = useAuth();

  const settings = useQuery(
    api.settings.getModelSettings,
    isAuthenticated ? {} : "skip"
  );
  const updateModelSettingsMutation = useMutation(api.settings.updateModelSettings);

  return {
    settings,
    isLoading: settings === undefined,
    updateModelSettings: async (model: string, provider: string) => {
      return await updateModelSettingsMutation({ model, provider });
    },
  };
}
