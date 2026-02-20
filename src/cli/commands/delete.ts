import chalk from 'chalk';
import type minimist from 'minimist';
import { createStorage } from '../../core/storage.js';
import { notifier } from '../../core/notifier.js';

interface DeleteArgs extends minimist.ParsedArgs {
  force?: boolean;
}

export async function deleteTicket(args: DeleteArgs): Promise<void> {
  const [, id] = args._;
  
  if (!id) {
    console.log(chalk.red('Error: Ticket ID is required'));
    console.log('Usage: tkxr delete <id>');
    return;
  }

  const storage = await createStorage();

  try {
    // Try to find and load the entity first to show what we're deleting
    const result = await storage.findEntity(id);
    
    if (!result) {
      console.log(chalk.red(`Error: No entity found with ID "${id}"`));
      return;
    }

    const { entity, type: entityType } = result;

    // Show what will be deleted
    console.log(chalk.yellow(`About to delete ${entityType.slice(0, -1)}: ${id}`));
    if (entity && typeof entity === 'object' && 'title' in entity) {
      console.log(`  Title: ${(entity as any).title}`);
    } else if (entity && typeof entity === 'object' && 'name' in entity) {
      console.log(`  Name: ${(entity as any).name}`);
    } else if (entity && typeof entity === 'object' && 'username' in entity) {
      console.log(`  Username: ${(entity as any).username}`);
    }

    // Confirm deletion unless --force is specified
    if (!args.force) {
      console.log(chalk.red('Use --force to confirm deletion'));
      return;
    }

    // Perform deletion
    if (entityType === 'tasks' || entityType === 'bugs') {
      // For tickets, first delete all associated comments
      const comments = await storage.getComments(id);
      for (const comment of comments) {
        await storage.deleteComment(comment.id);
      }
      console.log(chalk.dim(`  Deleted ${comments.length} associated comment(s)...`));
    }
    
    const deleted = await storage.deleteEntity(entityType, id);
    
    if (deleted) {
      // Notify web UI if it's a ticket (task or bug)
      if (entityType === 'tasks' || entityType === 'bugs') {
        await notifier.notifyTicketDeleted(id);
      }
      
      console.log(chalk.green(`✓ Deleted ${entityType.slice(0, -1)}: ${id}`));
    } else {
      console.log(chalk.red(`Error: Failed to delete ${id}`));
    }
  } catch (error) {
    console.log(chalk.red(`Error deleting ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}