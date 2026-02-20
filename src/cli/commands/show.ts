import chalk from 'chalk';
import type minimist from 'minimist';
import { createStorage } from '../../core/storage.js';
import type { Ticket, TicketStatus } from '../../core/types.js';

interface ShowArgs extends minimist.ParsedArgs {
  _: string[];
}

export async function showTicket(args: ShowArgs): Promise<void> {
  const [, ticketId] = args._;
  
  if (!ticketId) {
    console.log(chalk.red('Error: Please provide a ticket ID'));
    console.log(chalk.dim('Usage: tkxr show <ticket-id>'));
    return;
  }

  const storage = await createStorage();

  try {
    // Find the ticket using the new storage method
    const result = await storage.findTicket(ticketId);
    
    if (!result) {
      console.log(chalk.red(`Ticket '${ticketId}' not found`));
      return;
    }

    const ticket = result.ticket;

    // Load related data for display names
    const users = await storage.getUsers();
    const sprints = await storage.getSprints();
    
    // Helper functions to get display names
    const getUserDisplayName = (userId: string | undefined) => {
      if (!userId) return undefined;
      const user = users.find(u => u.id === userId);
      return user?.displayName || userId;
    };
    
    const getSprintName = (sprintId: string | undefined) => {
      if (!sprintId) return undefined;
      const sprint = sprints.find(s => s.id === sprintId);
      return sprint?.name || sprintId;
    };

    const statusColors: Record<TicketStatus, (text: string) => string> = {
      todo: chalk.gray,
      progress: chalk.yellow,
      done: chalk.green,
    };
    
    const priorityColors = {
      low: chalk.blue,
      medium: chalk.yellow,
      high: chalk.magenta,
      critical: chalk.red,
    };
    
    const typeIcon = ticket.type === 'task' ? '📋' : '🐛';
    const statusColor = statusColors[ticket.status] || chalk.white;
    const priorityColor = ticket.priority ? priorityColors[ticket.priority] || chalk.white : chalk.white;
    
    console.log();
    console.log(chalk.bold(`${typeIcon} ${ticket.title}`));
    console.log(chalk.dim('─'.repeat(50)));
    console.log(`${chalk.blue('ID:')}        ${ticket.id}`);
    console.log(`${chalk.blue('Type:')}      ${ticket.type}`);
    console.log(`${chalk.blue('Status:')}    ${statusColor(ticket.status)}`);
    
    if (ticket.priority) {
      console.log(`${chalk.blue('Priority:')}  ${priorityColor(ticket.priority)}`);
    }
    
    if (ticket.assignee) {
      console.log(`${chalk.blue('Assignee:')}  ${getUserDisplayName(ticket.assignee)}`);
    }
    
    if (ticket.sprint) {
      console.log(`${chalk.blue('Sprint:')}    ${getSprintName(ticket.sprint)}`);
    }
    
    if (ticket.estimate) {
      console.log(`${chalk.blue('Estimate:')}  ${ticket.estimate} ${ticket.estimate === 1 ? 'point' : 'points'}`);
    }
    
    if (ticket.labels && ticket.labels.length > 0) {
      console.log(`${chalk.blue('Labels:')}    ${ticket.labels.join(', ')}`);
    }
    
    if (ticket.description) {
      console.log();
      console.log(chalk.blue('Description:'));
      console.log(ticket.description);
    }
    
    console.log();
    console.log(chalk.dim(`Created: ${new Date(ticket.createdAt).toLocaleString()}`));
    console.log(chalk.dim(`Updated: ${new Date(ticket.updatedAt).toLocaleString()}`));
    console.log();
    
  } catch (error) {
    console.log(chalk.red(`Error showing ticket: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}