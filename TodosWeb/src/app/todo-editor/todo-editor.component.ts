import { Component, Input, OnInit } from '@angular/core';
import { TodoService } from 'src/app/todo.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Todo } from '../todo';
import { ActivatedRoute } from '@angular/router'

@Component({
  selector: 'app-todo-editor',
  templateUrl: './todo-editor.component.html',
  styleUrls: ['./todo-editor.component.scss']
})
export class TodoEditorComponent implements OnInit {
  
  private todoId: string;
  public todoForm: FormGroup;
  public loading: boolean = false;
  constructor(
    private todoService: TodoService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private _snackBar: MatSnackBar
  ) {
    this.todoForm = this.formBuilder.group(
      {
        id: [''],
        todoTitle: ['', Validators.required],
        creationDate: [''],
        parsedDate: [new Date(), Validators.required],
        done: [false, Validators.required],
        priority: ["1", Validators.required]
      }
    );
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.todoId = params['todoId'];
      this.getTodo(this.todoId);
    });
  }

  public getTodo(id: any): void {
    this.loading = true;
    setTimeout(() => {
      this.todoService.retrievetById(id)
      .subscribe((data: Todo) => {
        this.loading = false;
        data.parsedDate = new Date(data.creationDate);
        this.todoForm.setValue(data);
      },(error) => {
        this.loading = false;
        console.log(error);
      });
    },2000);
  }

  public showLoading(): void {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  public doRequest(): void {
    this.loading = true;
    setTimeout(() => {
      let data: Todo = this.todoForm.value;
      data.creationDate = data.parsedDate.toDateString();
      if (data.id === undefined || data.id === "")
      {
        this.todoService.create(data)
        .subscribe((data: Todo) => this.successMessage("Todo criado com sucesso")
        ,(error) => this.errorMessage(error, "Erro ao inserir novo Todo"));
      }
      else 
      {
        this.todoService.update(data)
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
    });
  }
}