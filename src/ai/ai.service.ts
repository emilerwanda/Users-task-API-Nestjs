import { Injectable } from '@nestjs/common';
import { TasksService } from '../tasks/tasks.service';
import { Task } from '../tasks/entities/task.entity';

@Injectable()
export class AiService {
  constructor(private tasksService: TasksService) {}

  /**
   * Analyze a task and generate insights
   */
  async analyzeTask(taskId: number, userId: any): Promise<object> {
    const task = await this.tasksService.findOne(taskId, userId);
    
    // In a real implementation, this would call an AI service API
    // For now, we'll simulate AI-generated insights
    const insights = this.generateTaskInsights(task);
    
    // Update the task with the insights
    await this.tasksService.update(taskId, { aiInsights: insights }, userId);
    
    return insights;
  }

  /**
   * Generate insights for multiple tasks
   */
  async generateDashboardInsights(userId: any): Promise<object> {
    const tasksResponse = await this.tasksService.findAll(userId);
    const tasks = tasksResponse.data;
    
    // Simulate AI analysis of tasks
    const completedTasks = tasks.filter(task => task.status === 'DONE').length;
    const pendingTasks = tasks.filter(task => task.status === 'PENDING').length;
    const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length;
    
    // Calculate completion rate
    const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
    
    // Identify overdue tasks
    const overdueTasks = tasks.filter(task => {
      return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
    });
    
    // Generate productivity score (simulated)
    const productivityScore = Math.min(100, Math.max(0, 
      completionRate + (tasks.length > 0 ? 20 : 0) - (overdueTasks.length * 5)
    ));
    
    return {
      taskSummary: {
        total: tasks.length,
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks.length
      },
      completionRate: Math.round(completionRate),
      productivityScore: Math.round(productivityScore),
      recommendations: this.generateRecommendations(tasks),
      lastUpdated: new Date()
    };
  }

  /**
   * Generate simulated insights for a single task
   */
  private generateTaskInsights(task: Task): object {
    // In a real implementation, this would use an AI service
    // For now, we'll return simulated insights
    return {
      estimatedEffort: this.calculateEstimatedEffort(task),
      similarTasks: this.findSimilarTaskPatterns(task),
      completionPrediction: this.predictCompletionTime(task),
      analysisTimestamp: new Date()
    };
  }

  /**
   * Calculate estimated effort based on task description and title
   */
  private calculateEstimatedEffort(task: Task): string {
    const descriptionLength = task.description?.length || 0;
    
    if (descriptionLength > 200) return 'High';
    if (descriptionLength > 100) return 'Medium';
    return 'Low';
  }

  /**
   * Find similar task patterns (simulated)
   */
  private findSimilarTaskPatterns(task: Task): string[] {
    // In a real implementation, this would use NLP to find similar tasks
    return [
      'Similar tasks typically completed in 3 days',
      'Tasks with this priority are often completed ahead of schedule',
      'Consider breaking this task into smaller subtasks for better tracking'
    ];
  }

  /**
   * Predict completion time (simulated)
   */
  private predictCompletionTime(task: Task): string {
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    
    return `Estimated completion by ${threeDaysLater.toISOString().split('T')[0]}`;
  }

  /**
   * Generate recommendations based on task analysis
   */
  private generateRecommendations(tasks: Task[]): string[] {
    const recommendations: string[] = []
    
    // Check for overdue tasks
    const overdueTasks = tasks.filter(task => {
      return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
    });
    
    if (overdueTasks.length > 0) {
      recommendations.push(`You have ${overdueTasks.length} overdue tasks. Consider prioritizing them.`);
    }
    
    // Check for tasks without due dates
    const tasksWithoutDueDates = tasks.filter(task => !task.dueDate);
    if (tasksWithoutDueDates.length > 0) {
      recommendations.push(`${tasksWithoutDueDates.length} tasks don't have due dates. Adding deadlines improves completion rates.`);
    }
    
    // Check workload distribution
    const highPriorityTasks = tasks.filter(task => task.priority === 'HIGH' && task.status !== 'DONE').length;
    if (highPriorityTasks > 3) {
      recommendations.push(`You have ${highPriorityTasks} high priority tasks. Consider delegating some tasks.`);
    }
    
    // Add a default recommendation if none were generated
    if (recommendations.length === 0) {
      recommendations.push('Your task management looks good! Keep up the good work.');
    }
    
    return recommendations;
  }
}