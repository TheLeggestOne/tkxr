import chalk from 'chalk';
import type minimist from 'minimist';
import { FileStorage } from '../../core/storage.js';
import type { TicketComment } from '../../core/types.js';

interface CommentsArgs extends minimist.ParsedArgs {
  _: string[];
  add?: boolean;
  author?: string;
  content?: string;
}

export async function manageComments(args: CommentsArgs): Promise<void> {
  const [, ticketId] = args._;
  
  if (!ticketId) {
    console.log(chalk.red('Error: Please provide a ticket ID'));
    console.log(chalk.dim('Usage: tkxr comments <ticket-id> [--add] [--author <author-id>] [--content <content>]'));
    return;
  }

  const storage = new FileStorage();

  try {
    // Verify ticket exists
    let ticket = await storage.loadEntity('tasks', ticketId);
    if (!ticket) {
      ticket = await storage.loadEntity('bugs', ticketId);
    }
    
    if (!ticket) {
      console.log(chalk.red(`Ticket '${ticketId}' not found`));
      return;
    }

    if (args.add) {
      await addComment(storage, ticketId, args);
    } else {
      await listComments(storage, ticketId);
    }
  } catch (error) {
    console.log(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

async function listComments(storage: FileStorage, ticketId: string): Promise<void> {
  const comments = await storage.getComments(ticketId);
  const users = await storage.getUsers();

  if (comments.length === 0) {
    console.log(chalk.yellow(`No comments found for ticket '${ticketId}'`));
    return;
  }

  console.log(chalk.bold(`\n💬 Comments for ticket ${ticketId} (${comments.length})\n`));

  // Sort comments by creation date
  const sortedComments = comments.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const comment of sortedComments) {
    const user = users.find(u => u.id === comment.author);
    const authorName = user?.displayName || user?.username || comment.author;
    const createdAt = new Date(comment.createdAt).toLocaleString();

    console.log(chalk.blue(`📝 ${comment.id}`));
    console.log(chalk.dim(`   Author: ${authorName}`));
    console.log(chalk.dim(`   Created: ${createdAt}`));
    console.log(`   ${comment.content}`);
    console.log();
  }
}

async function addComment(storage: FileStorage, ticketId: string, args: CommentsArgs): Promise<void> {
  const { author, content } = args;

  if (!author) {
    console.log(chalk.red('Error: --author is required when adding a comment'));
    console.log(chalk.dim('Usage: tkxr comments <ticket-id> --add --author <author-id> --content <content>'));
    return;
  }

  if (!content) {
    console.log(chalk.red('Error: --content is required when adding a comment'));
    console.log(chalk.dim('Usage: tkxr comments <ticket-id> --add --author <author-id> --content <content>'));
    return;
  }

  // Verify author exists
  const users = await storage.getUsers();
  const user = users.find(u => u.id === author || u.username === author);
  
  if (!user) {
    console.log(chalk.red(`Error: User '${author}' not found`));
    console.log(chalk.dim('Use: tkxr users - to see available users'));
    return;
  }

  const comment = await storage.createComment(ticketId, user.id, content);

  console.log(chalk.green('✓ Comment added successfully'));
  console.log(chalk.dim(`  ID: ${comment.id}`));
  console.log(chalk.dim(`  Author: ${user.displayName || user.username}`));
  console.log(chalk.dim(`  Content: ${content}`));
}