import chalk from 'chalk';
import type minimist from 'minimist';
import { createStorage } from '../../core/storage.js';

interface SprintsArgs extends minimist.ParsedArgs {
  _: string[];
  status?: 'planning' | 'active' | 'completed';
  archived?: boolean;
  a?: boolean;
}

export async function listSprints(args: SprintsArgs): Promise<void> {
  try {
    const storage = await createStorage();
    let sprints = await storage.getSprints();

    // Filter by status if provided
    if (args.status) {
      sprints = sprints.filter(sprint => sprint.status === args.status);
    }

    // Get archived sprints if requested
    const archived = args.archived || args.a ? await storage.getArchivedSprints() : [];

    if (sprints.length === 0 && archived.length === 0) {
      const statusText = args.status ? ` with status "${args.status}"` : '';
      console.log(chalk.yellow(`No sprints found${statusText}.`));
      return;
    }

    // Active sprints
    if (sprints.length > 0) {
      const statusText = args.status ? ` (${args.status})` : '';
      console.log(chalk.blue.bold(`Found ${sprints.length} sprint${sprints.length === 1 ? '' : 's'}${statusText}:`));
      console.log();

      for (const sprint of sprints) {
        const statusColor = 
          sprint.status === 'completed' ? 'green' :
          sprint.status === 'active' ? 'blue' : 'yellow';

        console.log(chalk.white.bold(sprint.name));
        console.log(chalk.gray(`  ID: ${sprint.id}`));
        console.log(chalk.gray(`  Status: `) + chalk[statusColor](sprint.status));
        if (sprint.description) {
          console.log(chalk.gray(`  Description: ${sprint.description}`));
        }
        if (sprint.goal) {
          console.log(chalk.gray(`  Goal: ${sprint.goal}`));
        }
        console.log(chalk.gray(`  Created: ${new Date(sprint.createdAt).toLocaleDateString()}`));
        if (sprint.startDate) {
          console.log(chalk.gray(`  Start Date: ${new Date(sprint.startDate).toLocaleDateString()}`));
        }
        if (sprint.endDate) {
          console.log(chalk.gray(`  End Date: ${new Date(sprint.endDate).toLocaleDateString()}`));
        }
        console.log();
      }
    }
    
    // Archived sprints
    if ((args.archived || args.a) && archived.length > 0) {
      if (sprints.length > 0) console.log('─'.repeat(50)); // Add separator
      console.log(chalk.blue.bold(`📁 Archived Sprints (${archived.length}):`));
      console.log();
      
      for (const sprintId of archived) {
        console.log(chalk.white.bold(`Sprint Archive: ${sprintId}`));
        console.log(chalk.gray(`  Archive File: tkxr/archives/archive-${sprintId}.yaml`));
        console.log(chalk.gray(`  Status: `) + chalk.green('completed'));
        console.log();
      }
    }
    
  } catch (error) {
    console.error(chalk.red('Error listing sprints:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}