import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CurrentUserDecorator } from 'src/auth/current-user.decorator';
import { CurrentUser } from 'src/interfaces/current-user.interface';
import { EditTaskDto } from './dtos/edit-task.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @UseGuards(AuthGuard)
    @Get('')
    async listTasks(@CurrentUserDecorator() user: CurrentUser) {
        return this.tasksService.listTasks(user.id);
    }

    @UseGuards(AuthGuard)
    @Get('/:id')
    async getTask(
        @Param('id', new ParseUUIDPipe()) id: string,
        @CurrentUserDecorator() user: CurrentUser,
    ) {
        return this.tasksService.getTask(id, user.id);
    }

    @UseGuards(AuthGuard)
    @Patch('/:id')
    async editTask(
        @Param('id') id: string,
        @Body() body: EditTaskDto,
        @CurrentUserDecorator() user: CurrentUser,
    ) {
        return this.tasksService.editTask(id, body, user.id);
    }
}
