import { Injectable } from '@nestjs/common';
import { TasksService } from '../tasks/tasks.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class DashboardService {
  constructor(
    private tasksService: TasksService,
    private aiService: AiService
  ) {}

  /**
   * Get dashboard data including task statistics and AI insights
   */
  async getDashboardData(user: any) {
    // Get all tasks for the user
    const tasksResponse = await this.tasksService.findAll(user);
    const tasks = tasksResponse.data;
    
    // Get AI insights
    const aiInsights = await this.aiService.generateDashboardInsights(user);
    
    // Calculate task statistics
    const taskStats = this.calculateTaskStatistics(tasks);
    
    return {
      taskStats,
      aiInsights,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate task statistics
   */
  private calculateTaskStatistics(tasks: any[]) {
    // Count tasks by status
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
    
    // Count tasks by priority
    const priorityCounts = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});
    
    // Count overdue tasks
    const overdueTasks = tasks.filter(task => {
      return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
    }).length;
    
    // Count tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tasksDueToday = tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate < tomorrow && task.status !== 'DONE';
    }).length;
    
    return {
      totalTasks: tasks.length,
      statusCounts,
      priorityCounts,
      overdueTasks,
      tasksDueToday
    };
  }
}