import React from 'react';
import { X, Sparkles } from 'lucide-react';

export interface Project {
  name: string;
  path?: string;
  fullPath?: string;
}

export interface CreateTaskModalProps {
  currentProject?: Project;
  onClose?: () => void;
  onTaskCreated?: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  currentProject,
  onClose,
  onTaskCreated
}) => {