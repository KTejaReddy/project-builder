// Supabase Service Integration Layer with LocalStorage Fallback Protection
import { Project, FileNode } from '../../types/project';
import { Bookmark, Note } from '../../types/ai';

export interface UserProfile {
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  joinedDate: string;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  modifiedFiles: string[];
  contentJson: string;
  description: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actionType: string;
  metadata: any;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  category: 'system' | 'lesson' | 'deploy';
  readStatus: boolean;
  createdAt: string;
}

// Check for client-side keys presence
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = SUPABASE_URL.trim() !== '' && SUPABASE_ANON_KEY.trim() !== '';

export const dbService = {
  // Check if Supabase connection is live
  isCloudConnected(): boolean {
    return isSupabaseConfigured;
  },

  // 1. User Profile Actions
  async getProfile(): Promise<UserProfile> {
    if (typeof window === 'undefined') {
      return this.getMockProfile();
    }
    
    if (isSupabaseConfigured) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            return {
              name: data.display_name,
              email: user.email || '',
              bio: data.bio,
              avatarUrl: data.avatar_url,
              xp: data.xp,
              level: data.level,
              streak: data.streak,
              badges: data.badges || [],
              joinedDate: new Date(data.joined_date).toLocaleDateString()
            };
          }
        }
      } catch (err) {
        console.warn("Supabase profile get failed, defaulting to local cache.", err);
      }
    }

    // Local Storage Fallback
    const saved = localStorage.getItem('user_profile');
    if (saved) return JSON.parse(saved);
    
    const def = this.getMockProfile();
    localStorage.setItem('user_profile', JSON.stringify(def));
    return def;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getProfile();
    const merged = { ...current, ...updates };

    if (typeof window !== 'undefined') {
      localStorage.setItem('user_profile', JSON.stringify(merged));
      
      if (isSupabaseConfigured) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('profiles').update({
              display_name: merged.name,
              avatar_url: merged.avatarUrl,
              bio: merged.bio,
              xp: merged.xp,
              level: merged.level,
              streak: merged.streak,
              badges: merged.badges
            }).eq('id', user.id);
          }
        } catch (err) {
          console.warn("Supabase profile sync write error: ", err);
        }
      }
      
      await this.addActivityLog('profile_updated', { fields: Object.keys(updates) });
    }

    return merged;
  },

  // 2. Project Operations
  async saveProject(project: Project): Promise<void> {
    if (typeof window === 'undefined') return;
    
    // Save locally
    const savedProjects = localStorage.getItem('user_projects');
    let list: Project[] = savedProjects ? JSON.parse(savedProjects) : [];
    const idx = list.findIndex(p => p.id === project.id);
    if (idx !== -1) {
      list[idx] = project;
    } else {
      list.push(project);
    }
    localStorage.setItem('user_projects', JSON.stringify(list));

    // Save cloud
    if (isSupabaseConfigured) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('projects').upsert({
            id: project.id,
            user_id: user.id,
            name: project.name,
            description: project.description,
            frontend: project.techStack.frontend,
            backend: project.techStack.backend,
            database_name: project.techStack.database,
            ai_provider: project.techStack.ai,
            deployment_provider: project.techStack.deployment,
            overview_json: project.objectives,
            architecture_json: project.architecture,
            database_json: project.dbSchemas,
            api_json: project.apiDocs,
            lessons_json: project.lessons,
            files_json: project.files,
            progress_json: { resume: project.resumeBulletPoints, linkedin: project.linkedinDescription },
            readme: project.readme,
            updated_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn("Supabase project sync write error: ", err);
      }
    }
  },

  async loadProjects(): Promise<Project[]> {
    if (typeof window === 'undefined') return [];

    if (isSupabaseConfigured) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const parsedList: Project[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            techStack: {
              frontend: item.frontend || '',
              backend: item.backend || '',
              database: item.database_name || '',
              ai: item.ai_provider || '',
              deployment: item.deployment_provider || ''
            },
            skills: item.overview_json || [],
            estimatedTime: '12 Hours',
            xpReward: 1000,
            difficulty: 'Intermediate',
            objectives: item.overview_json || [],
            roadmap: [],
            features: [],
            interviewQuestions: [],
            architecture: item.architecture_json || { systemDiagram: '', databaseDiagram: '' },
            dbSchemas: item.database_json || [],
            apiDocs: item.api_json || [],
            lessons: item.lessons_json || [],
            files: item.files_json || [],
            resumeBulletPoints: item.progress_json?.resume || [],
            linkedinDescription: item.progress_json?.linkedin || '',
            readme: item.readme || '',
            isFavorite: item.is_favorite || false,
            isPinned: item.is_pinned || false,
            isArchived: item.is_archived || false
          }));

          // Synchronize/Merge with local list to ensure offline resilience
          localStorage.setItem('user_projects', JSON.stringify(parsedList));
          return parsedList;
        }
      } catch (err) {
        console.warn("Supabase project select query failed, loading from local storage.", err);
      }
    }

    const saved = localStorage.getItem('user_projects');
    return saved ? JSON.parse(saved) : [];
  },

  async deleteProject(id: string): Promise<void> {
    if (typeof window === 'undefined') return;

    const list = await this.loadProjects();
    const filtered = list.filter(p => p.id !== id);
    localStorage.setItem('user_projects', JSON.stringify(filtered));

    if (isSupabaseConfigured) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        await supabase.from('projects').delete().eq('id', id);
      } catch (err) {
        console.warn("Supabase project delete action error: ", err);
      }
    }
    
    await this.addActivityLog('project_deleted', { projectId: id });
  },

  // 3. Project Versions Snapshots Rollbacks
  async createVersionSnapshot(projectId: string, versionNumber: number, modifiedFiles: string[], content: string, description: string): Promise<ProjectVersion> {
    const version: ProjectVersion = {
      id: Math.random().toString(36).substring(7),
      projectId,
      versionNumber,
      modifiedFiles,
      contentJson: content,
      description,
      createdAt: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`project_versions_${projectId}`);
      const list: ProjectVersion[] = saved ? JSON.parse(saved) : [];
      list.push(version);
      localStorage.setItem(`project_versions_${projectId}`, JSON.stringify(list));

      if (isSupabaseConfigured) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          await supabase.from('project_versions').insert({
            project_id: projectId,
            version_number: versionNumber,
            modified_files: modifiedFiles,
            content_json: content,
            description
          });
        } catch (err) {
          console.warn("Supabase version snapshot write error: ", err);
        }
      }
      
      await this.addActivityLog('version_created', { projectId, versionNumber });
    }

    return version;
  },

  async getVersionSnapshots(projectId: string): Promise<ProjectVersion[]> {
    if (typeof window === 'undefined') return [];

    if (isSupabaseConfigured) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data, error } = await supabase
          .from('project_versions')
          .select('*')
          .eq('project_id', projectId)
          .order('version_number', { ascending: false });
        
        if (!error && data) {
          return data.map((item: any) => ({
            id: item.id,
            projectId: item.project_id,
            versionNumber: item.version_number,
            modifiedFiles: item.modified_files || [],
            contentJson: item.content_json,
            description: item.description || '',
            createdAt: item.created_at
          }));
        }
      } catch (err) {
        console.warn("Supabase version select query failed.", err);
      }
    }

    const saved = localStorage.getItem(`project_versions_${projectId}`);
    return saved ? JSON.parse(saved) : [];
  },

  // 4. Activity Logs
  async addActivityLog(actionType: string, metadata: any): Promise<void> {
    if (typeof window === 'undefined') return;

    const log: ActivityLog = {
      id: Math.random().toString(36).substring(7),
      actionType,
      metadata,
      createdAt: new Date().toISOString()
    };

    const saved = localStorage.getItem('activity_logs');
    const list: ActivityLog[] = saved ? JSON.parse(saved) : [];
    list.unshift(log); // newest first
    localStorage.setItem('activity_logs', JSON.stringify(list.slice(0, 50)));

    if (isSupabaseConfigured) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('activity_logs').insert({
            user_id: user.id,
            action_type: actionType,
            metadata_json: metadata
          });
        }
      } catch (err) {
        console.warn("Supabase activity log sync write error: ", err);
      }
    }
  },

  async getActivityLogs(): Promise<ActivityLog[]> {
    if (typeof window === 'undefined') return [];

    if (isSupabaseConfigured) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25);

        if (!error && data) {
          return data.map((item: any) => ({
            id: item.id,
            actionType: item.action_type,
            metadata: item.metadata_json,
            createdAt: item.created_at
          }));
        }
      } catch (err) {
        console.warn("Supabase activity logs read error: ", err);
      }
    }

    const saved = localStorage.getItem('activity_logs');
    return saved ? JSON.parse(saved) : [];
  },

  // 5. Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    if (typeof window === 'undefined') return [];

    if (isSupabaseConfigured) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category as any,
            readStatus: item.read_status,
            createdAt: item.created_at
          }));
        }
      } catch (err) {
        console.warn("Supabase notifications read error: ", err);
      }
    }

    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : this.getMockNotifications();
  },

  async addNotification(title: string, description: string, category: 'system' | 'lesson' | 'deploy'): Promise<void> {
    if (typeof window === 'undefined') return;

    const notif: NotificationItem = {
      id: Math.random().toString(36).substring(7),
      title,
      description,
      category,
      readStatus: false,
      createdAt: new Date().toISOString()
    };

    const saved = localStorage.getItem('notifications');
    const list: NotificationItem[] = saved ? JSON.parse(saved) : [];
    list.unshift(notif);
    localStorage.setItem('notifications', JSON.stringify(list));

    if (isSupabaseConfigured) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('notifications').insert({
            user_id: user.id,
            title,
            description,
            category,
            read_status: false
          });
        }
      } catch (err) {
        console.warn("Supabase notification insert error: ", err);
      }
    }
  },

  async markNotificationAsRead(id: string): Promise<void> {
    if (typeof window === 'undefined') return;

    const notifs = await this.getNotifications();
    const updated = notifs.map(n => n.id === id ? { ...n, readStatus: true } : n);
    localStorage.setItem('notifications', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        await supabase.from('notifications').update({ read_status: true }).eq('id', id);
      } catch (err) {
        console.warn("Supabase notifications update error: ", err);
      }
    }
  },

  getMockProfile(): UserProfile {
    return {
      name: 'Guest Developer',
      email: 'guest@projectforge.ai',
      bio: 'Junior Software Engineer learning scalable TypeScript and microservices stacks.',
      avatarUrl: undefined,
      xp: 1200,
      level: 2,
      streak: 3,
      badges: ['First Step', 'Innovator', 'Early Adopter'],
      joinedDate: 'July 2026'
    };
  },

  getMockNotifications(): NotificationItem[] {
    return [
      {
        id: 'n1',
        title: 'Project Generated Successfully',
        description: 'Your blueprint app stack is ready to edit.',
        category: 'system',
        readStatus: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'n2',
        title: 'Welcome to ProjectForge AI',
        description: 'Select templates in the dashboard to start learning development pathways.',
        category: 'system',
        readStatus: true,
        createdAt: new Date().toISOString()
      }
    ];
  }
};
