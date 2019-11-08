import { Component, OnInit } from '@angular/core';
import { TodoService } from 'src/app/todo.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Todo } from '../todo';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss']
})
export class TodoListComponent implements OnInit {

  public loading: boolean = false;
  private todoListArray: Todo[]
  constructor(
    private todoService: TodoService,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.getTodos();
  }

  public getTodos(): void {
    this.loading = true;
    setTimeout(() => {
      this.todoService.retrieveAll()
      .subscribe(items => {
        this.loading = false;
        this.todoListArray = items;
      },(error) => {
        this.loading = false;
        console.log(error);
      });
    },2000);
  }

  public concludeTodo(todoIndex: number): void {
    this.loading = true;
    setTimeout(() => {
      let todo = this.todoListArray[todoIndex];
      if (todo.done) {
        this.todoService.delete(todo.id)
        .subscribe(() => {
          this.successMessage("Todo removido com sucesso");
          this.getTodos();
        }
        ,(error) => this.errorMessage(error, "Erro ao atualizar Todo"));
      }
      else {
        todo.done = true;
        this.todoService.update(todo)
        .subscribe((data: Todo) => this.successMessage("Todo atualizado com sucesso")
        ,(error) => this.errorMessage(error, "Erro ao atualizar Todo"));
      }
    },2000);
  }

  private successMessage(successMessage: string) 
  {
    this.loading = false;
    console.log(successMessage);
    this._snackBar.open(successMessage, null, {
      duration: 2000,
    });
  }
  
  private errorMessage(error: string, errorMessage: string) 
  {
    this.loading = false;
    console.log(error);
    this._snackBar.open(errorMessage, null, {
      duration: 2000,
    })
  }
  
}