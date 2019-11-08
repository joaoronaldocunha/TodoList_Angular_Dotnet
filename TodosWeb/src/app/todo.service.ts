import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { Todo } from './todo'; 

var httpOptions = {headers: new HttpHeaders({"Content-Type": "application/json"})};

@Injectable({
  providedIn: 'root'
})
export class TodoService {

  private url = 'https://localhost:5001/api/todo';  
  
  constructor(
    private http: HttpClient
  ) { }

  public create(newTodo: any): Observable<any> {
    return this.http.post(this.url, newTodo, httpOptions);
  }

  public retrievetById(id: number): Observable<Todo> {
    return this.http.get<Todo>(`${this.url}/${id}`);
  }

  public retrieveAll(): Observable<Todo[]> {
    return this.http.get<Todo[]>(this.url);
  }

  public update(udatedTodo: Todo): Observable<Todo> {
    return this.http.put<Todo>(this.url, udatedTodo, httpOptions);
  }

  public delete(id: string): Observable<number> {
    return this.http.delete<number>(`${this.url}/${id}`);
  }
}