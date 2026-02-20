import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { nanoid } from 'nanoid';
import type { Ticket, Sprint, User, TicketType, TicketComment, ProjectData } from './types.js';

/**
 * TKXR Project Storage - Single-file YAML storage for all project data
 */
export class ProjectStorage {
  private projectPath: string;
  private data: ProjectData;

  constructor(projectPath: string = './tkxr/project.yaml') {
    this.projectPath = path.resolve(projectPath);
    this.data = this.getDefaultProjectData();
  }

  private getDefaultProjectData(): ProjectData {
    return {
      version: '1.0',
      project: {
        name: 'TKXR Project',
        created: new Date(),
        updated: new Date(),
      },
      users: [],
      sprints: [],
      tickets: [],
      comments: []
    };
  }

  private generateId(type: string): string {
    const prefix = type.substring(0, 3);
    const id = nanoid(8);
    return `${prefix}-${id}`;
  }

  async loadProject(): Promise<void> {
    try {
      // Ensure tkxr directory exists
      const tkxrDir = path.dirname(this.projectPath);
      await fs.mkdir(tkxrDir, { recursive: true });
      
      const content = await fs.readFile(this.projectPath, 'utf8');
      const parsed = yaml.load(content) as ProjectData;
      
      // Convert date strings back to Date objects
      parsed.project.created = new Date(parsed.project.created);
      parsed.project.updated = new Date(parsed.project.updated);
      
      parsed.users.forEach(user => {
        user.createdAt = new Date(user.createdAt);
        user.updatedAt = new Date(user.updatedAt);
      });
      
      parsed.sprints.forEach(sprint => {
        sprint.createdAt = new Date(sprint.createdAt);
        sprint.updatedAt = new Date(sprint.updatedAt);
        if (sprint.startDate) sprint.startDate = new Date(sprint.startDate);
        if (sprint.endDate) sprint.endDate = new Date(sprint.endDate);
      });
      
      parsed.tickets.forEach(ticket => {
        ticket.createdAt = new Date(ticket.createdAt);
        ticket.updatedAt = new Date(ticket.updatedAt);
      });
      
      parsed.comments.forEach(comment => {
        comment.createdAt = new Date(comment.createdAt);
        comment.updatedAt = new Date(comment.updatedAt);
      });
      
      this.data = parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.data = this.getDefaultProjectData();
        await this.saveProject();
      } else {
        throw error;
      }
    }
  }

  async saveProject(): Promise<void> {
    this.data.project.updated = new Date();
    
    const yamlContent = yaml.dump(this.data, {
      indent: 2,
      lineWidth: 120,
      forceQuotes: false,
    });
    
    await fs.writeFile(this.projectPath, yamlContent, 'utf8');
  }

  // User methods
  async createUser(username: string, displayName: string, options: Partial<User> = {}): Promise<User> {
    const now = new Date();
    const user: User = {
      id: this.generateId('user'),
      username,
      displayName,
      createdAt: now,
      updatedAt: now,
      ...options,
    };

    this.data.users.push(user);
    await this.saveProject();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return [...this.data.users];
  }

  async deleteUser(userId: string): Promise<boolean> {
    const index = this.data.users.findIndex(u => u.id === userId);
    if (index === -1) return false;
    
    this.data.users.splice(index, 1);
    await this.saveProject();
    return true;
  }

  // Sprint methods
  async createSprint(name: string, options: Partial<Sprint> = {}): Promise<Sprint> {
    const now = new Date();
    const sprint: Sprint = {
      id: this.generateId('sprint'),
      name,
      status: 'planning',
      createdAt: now,
      updatedAt: now,
      ...options,
    };

    this.data.sprints.push(sprint);
    await this.saveProject();
    return sprint;
  }

  async getSprints(): Promise<Sprint[]> {
    return [...this.data.sprints];
  }

  async updateSprintStatus(id: string, status: Sprint['status']): Promise<Sprint | null> {
    const sprint = this.data.sprints.find(s => s.id === id);
    if (!sprint) return null;

    const oldStatus = sprint.status;
    sprint.status = status;
    sprint.updatedAt = new Date();
    
    // If moving to completed, archive the sprint data
    if (oldStatus !== 'completed' && status === 'completed') {
      await this.archiveCompletedSprint(sprint);
    }
    
    await this.saveProject();
    return sprint;
  }

  async deleteSprint(sprintId: string): Promise<boolean> {
    const index = this.data.sprints.findIndex(s => s.id === sprintId);
    if (index === -1) return false;
    
    this.data.sprints.splice(index, 1);
    await this.saveProject();
    return true;
  }

  // Ticket methods
  async createTicket(type: TicketType, title: string, options: Partial<Ticket> = {}): Promise<Ticket> {
    const now = new Date();
    const ticket: Ticket = {
      id: this.generateId(type),
      type,
      title,
      status: 'todo',
      createdAt: now,
      updatedAt: now,
      ...options,
    };

    this.data.tickets.push(ticket);
    await this.saveProject();
    return ticket;
  }

  async getAllTickets(): Promise<Ticket[]> {
    return [...this.data.tickets];
  }

  async getTicketsByType(type: TicketType): Promise<Ticket[]> {
    return this.data.tickets.filter(t => t.type === type);
  }

  async updateTicketStatus(id: string, status: Ticket['status']): Promise<Ticket | null> {
    const ticket = this.data.tickets.find(t => t.id === id);
    if (!ticket) return null;

    ticket.status = status;
    ticket.updatedAt = new Date();
    
    await this.saveProject();
    return ticket;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | null> {
    const ticket = this.data.tickets.find(t => t.id === id);
    if (!ticket) return null;

    Object.assign(ticket, updates);
    ticket.updatedAt = new Date();
    
    await this.saveProject();
    return ticket;
  }

  async deleteTicket(ticketId: string): Promise<boolean> {
    const index = this.data.tickets.findIndex(t => t.id === ticketId);
    if (index === -1) return false;
    
    this.data.tickets.splice(index, 1);
    await this.saveProject();
    return true;
  }

  // Comment methods
  async createComment(ticketId: string, author: string, content: string): Promise<TicketComment> {
    const now = new Date();
    const comment: TicketComment = {
      id: this.generateId('comment'),
      ticketId,
      author,
      content,
      createdAt: now,
      updatedAt: now,
    };

    this.data.comments.push(comment);
    await this.saveProject();
    return comment;
  }

  async getComments(ticketId: string): Promise<TicketComment[]> {
    return this.data.comments.filter(c => c.ticketId === ticketId);
  }

  async deleteComment(commentId: string): Promise<boolean> {
    const index = this.data.comments.findIndex(c => c.id === commentId);
    if (index === -1) return false;
    
    this.data.comments.splice(index, 1);
    await this.saveProject();
    return true;
  }

  // Helper methods for CLI compatibility
  async getTicketsBySprint(sprintId: string): Promise<Ticket[]> {
    return this.data.tickets.filter(t => t.sprint === sprintId);
  }

  async findTicket(ticketId: string): Promise<{ ticket: Ticket } | null> {
    const ticket = this.data.tickets.find(t => t.id === ticketId);
    if (ticket) {
      return { ticket };
    }
    return null;
  }

  // Extra helper methods for delete command compatibility
  async findEntity(id: string): Promise<{ entity: any, type: string } | null> {
    // Check tickets
    const ticket = this.data.tickets.find(t => t.id === id);
    if (ticket) return { entity: ticket, type: ticket.type === 'task' ? 'tasks' : 'bugs' };
    
    // Check sprints
    const sprint = this.data.sprints.find(s => s.id === id);
    if (sprint) return { entity: sprint, type: 'sprints' };
    
    // Check users
    const user = this.data.users.find(u => u.id === id);
    if (user) return { entity: user, type: 'users' };
    
    return null;
  }

  async deleteEntity(entityType: string, id: string): Promise<boolean> {
    switch (entityType) {
      case 'tasks':
      case 'bugs':
        return this.deleteTicket(id);
      case 'sprints':
        return this.deleteSprint(id);
      case 'users':
        return this.deleteUser(id);
      case 'comments':
        return this.deleteComment(id);
      default:
        return false;
    }
  }

  // Sprint archiving to handle scale
  private async archiveCompletedSprint(sprint: Sprint): Promise<void> {
    try {
      const sprintTickets = this.data.tickets.filter(t => t.sprint === sprint.id);
      const sprintComments = this.data.comments.filter(c => 
        sprintTickets.some(t => t.id === c.ticketId)
      );

      if (sprintTickets.length === 0) return; // Nothing to archive

      // Ensure archives directory exists
      const archivesDir = './tkxr/archives';
      try {
        await fs.mkdir(archivesDir, { recursive: true });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
          throw error;
        }
      }

      // Create archive data
      const archiveData = {
        version: '1.0',
        sprint,
        tickets: sprintTickets,
        comments: sprintComments,
        archivedAt: new Date()
      };

      // Save to archive file in archives directory
      const archivePath = path.join(archivesDir, `archive-${sprint.id}.yaml`);
      const yamlContent = yaml.dump(archiveData, {
        indent: 2,
        lineWidth: 120,
        forceQuotes: false,
      });
      
      await fs.writeFile(archivePath, yamlContent, 'utf8');

      // Remove archived tickets and comments from main file
      this.data.tickets = this.data.tickets.filter(t => t.sprint !== sprint.id);
      this.data.comments = this.data.comments.filter(c => 
        !sprintTickets.some(t => t.id === c.ticketId)
      );

      console.log(`✓ Archived ${sprintTickets.length} tickets and ${sprintComments.length} comments to ${archivePath}`);
    } catch (error) {
      console.error('Error archiving sprint:', error);
      throw error;
    }
  }

  // Get archived sprint data
  async getArchivedSprintData(sprintId: string): Promise<any | null> {
    try {
      const archivePath = path.join('./tkxr/archives', `archive-${sprintId}.yaml`);
      const content = await fs.readFile(archivePath, 'utf8');
      return yaml.load(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  // List all archived sprints
  async getArchivedSprints(): Promise<string[]> {
    try {
      const archivesDir = './tkxr/archives';
      const files = await fs.readdir(archivesDir);
      return files
        .filter(f => f.startsWith('archive-') && f.endsWith('.yaml'))
        .map(f => f.replace('archive-', '').replace('.yaml', ''));
    } catch (error) {
      return [];
    }
  }
}

// Create storage instance - now always returns ProjectStorage
export const createStorage = async (): Promise<ProjectStorage> => {
  const storage = new ProjectStorage();
  await storage.loadProject();
  return storage;
};