# Capacitação Web

## Etapa 1: Criar repositório Git.

1. Acessar github.com

2. Entrar com sua conta ou criar nova conta

3. Criar novo repostório vazio

4. Após criado o repositório, copiar endereço HTTPS para criar uma cópia local do repositório

5. No seu desktop, abrir linha de comando

6. Acessar pasta onde deseja baixar cópia local do repositório

7. Executar seguinte comando para baixar a cópia do repositório:

```
git clone <ENDEREÇO HTTPS DO REPOSITÓRIO CRIADO>
```

8. Abrir nova pasta criada no Visual Studio Code

## Etapa 2: Criar local para armazenamento de dados
[Baseado no artigo da Microsoft!](https://docs.microsoft.com/pt-br/aspnet/core/tutorials/first-mongo-app?view=aspnetcore-3.0&tabs=visual-studio-code#test-the-web-api)

1. Acessar o site do MongoDB e baixar a versão Community: [https://www.mongodb.com/download-center/community](https://www.mongodb.com/download-center/community)

2. Instalar o MongoDB no Desktop. Nâo é necessário instalar o MongoD como serviço

3. Se usar o Windows, o MongoDB será instalado em C:\Arquivos de Programas\MongoDB por padrão.

4. Abrir prompt de comando e acessar a pasta "bin" da versão do MongoDB instalada. Exemplo:

```
cd "C:\Program Files\MongoDB\Server\4.2\bin"
```

5. Ainda no prompt de comando, executar o comando "mongod" indicando o caminho onde deseja criar sua base de dados (criar antes o caminho). Exemplo:

```
mkdir c:\dev\mongodb\todolistdb
mongod --dbpath c:\dev\mongodb\todolistdb
```

> Agora o banco NoSQL do Mongo está em execução. Não fechar este prompt de comando.

6.  Abrir outro prompt de comando para testar:

```
cd "C:\Program Files\MongoDB\Server\4.2\bin"
mongo
```

7. Ele irá executar o shel do MongoDB. Neste shell, execute o seguinte comando:

```
use TodoListDb
```

> Se ele ainda não existir, um banco de dados chamado TodoListDb será criado. Se o banco de dados existir, a conexão dele será aberta para transações.

8. Crie a coleção de Todos:

```
db.createCollection('Todos')
```

> Ele retornará um documento de sucesso: { "ok" : 1 }

## Etapa 3: Criar Web API para acessar o banco de dados usando Asp.Net Core

1. Abrir no Visual Studio Code a pasta onde está a cópia local do repositório

2. Abrir o terminal e executar o seguinte comando:

```
dotnet new webapi -o TodosAPI
```

> Será criado o projeto dentro da pasta TodosAPI.

3. Ainda no terminal, acessar a pasta "TodosAPI"

```
cd TodosAPI
```

4. Adicionar pacote do Mongo (Visite a Galeria do NuGet: [https://www.nuget.org/packages/MongoDB.Driver/](https://www.nuget.org/packages/MongoDB.Driver/) para determinar a versão estável mais recente do driver .NET para MongoDB.):

```
dotnet add TodosAPI.csproj package MongoDB.Driver -v {VERSION}
```

5. Criar na raiz do projeto TodosAPI a pasta "Models"

6. Adicionar novo arquivo Todo.js que representa a nossa tarefa:

```csharp
using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TodosAPI.Models
{
    public class Todo
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("Title")]
        public string TodoTitle { get; set; }

        public string CreationDate { get; set; }

        public bool Done { get; set; }

        public string Priority { get; set; }
    }
}
```

> Nesta classe, a propriedade Id é necessária para mapear o objeto CLR (Common Language Runtime) para a coleção do MongoDB. Ela é anotada com [BsonId] para ser designada como a chave primária do documento. Além disso, ela é anotada com [BsonRepresentation(BsonType.ObjectId)] para permitir a passagem do parâmetro como o tipo string em vez de uma estrutura ObjectId. O Mongo processa a conversão de string para ObjectId. Já a propriedade TodoTile é anotada com o atributo [BsonElement]. O valor do atributo de Title representa o nome da propriedade da coleção do MongoDB.

7. Especificar um modelo de configuração, adicionando o seguinte objeto de configuração de banco de dados no appsettings.json:

```json
"TodoListDatabaseSettings": {
    "TodosCollectionName": "Todos",
    "ConnectionString": "mongodb://localhost:27017",
    "DatabaseName": "TodoListDb"
}
```

8. Adicione um arquivo TodoListDatabaseSettings.cs no diretório Models com o código a seguir:

```csharp
namespace TodosAPI.Models
{
    public class TodoListDatabaseSettings : ITodoListDatabaseSettings
    {
        public string TodosCollectionName { get; set; }
        public string ConnectionString { get; set; }
        public string DatabaseName { get; set; }
    }

    public interface ITodoListDatabaseSettings
    {
        string TodosCollectionName { get; set; }
        string ConnectionString { get; set; }
        string DatabaseName { get; set; }
    }
}
```

> A classe precedente TodoListDatabaseSettings é usada para armazenar os valores de propriedade TodoListDatabaseSettings do arquivo appsettings.json. Os nomes de propriedade JSON e C# são nomeados de forma idêntica para facilitar o processo de mapeamento.

9. Abrir o arquivo Startup.cs e modificar o método ConfigureServices(IServiceCollection):

```csharp
public void ConfigureServices(IServiceCollection services)
{
    // requires using Microsoft.Extensions.Options
    services.Configure<TodoListDatabaseSettings>(
        Configuration.GetSection(nameof(TodoListDatabaseSettings)));

    services.AddSingleton<ITodoListDatabaseSettings>(sp =>
        sp.GetRequiredService<IOptions<TodoListDatabaseSettings>>().Value);

    services.AddControllers();
}
```

> Incluir as cláusulas using via recurso do VisualStudio Code ou manualmente:

``` csharp
using Microsoft.Extensions.Options;
using TodosAPI.Models;
```

> A instância de configuração à qual a seção TodoListDatabaseSettings do arquivo appsettings.json é associada é registrada no contêiner de DI (Injeção de Dependência). Por exemplo, a propriedade ConnectionString de um objeto TodoListDatabaseSettings é populada com a propriedade TodoListDatabaseSettings:ConnectionString no appsettings.json.

> A interface ITodoListDatabaseSettings é registrada na DI com um tempo de vida do serviço singleton. Quando inserida, a instância da interface é resolvida para um objeto TodoListDatabaseSettings.

10. Adicionar agora o CRUD. Criar a pasta "Services" e nele o arquivo "TodoService.cs" com o seguinte código:

```csharp
using TodosAPI.Models;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Linq;

namespace TodosAPI.Services
{
    public class TodoService
    {
        private readonly IMongoCollection<Todo> _todos;

        public TodoService(ITodoListDatabaseSettings settings)
        {
            var client = new MongoClient(settings.ConnectionString);
            var database = client.GetDatabase(settings.DatabaseName);

            _todos = database.GetCollection<Todo>(settings.TodosCollectionName);
        }

        public List<Todo> Get() =>
            _todos.Find(todo => true).ToList();

        public Todo Get(string id) =>
            _todos.Find<Todo>(todo => todo.Id == id).FirstOrDefault();

        public Todo Create(Todo todo)
        {
            _todos.InsertOne(todo);
            return todo;
        }

        public void Update(Todo todoIn) =>
            _todos.ReplaceOne(todo => todo.Id == todoIn.Id, todoIn);

        public void Remove(Todo todoIn) =>
            _todos.DeleteOne(todo => todo.Id == todoIn.Id);

        public void Remove(string id) => 
            _todos.DeleteOne(todo => todo.Id == id);
    }
}
```

> Neste código, uma instância ITodoListDatabaseSettings é recuperada da DI por meio da injeção de construtor. Essa técnica fornece acesso para os valores de configuração do appsettings.json que foram adicionados na seção Adicionar um modelo de configuração.

11. Adicionar o TodoService como singleton no código, incluindo a seguinte linha de código no método ConfigureServices(IServiceCollection), antes da invocação de ```services.AddControllers()```:

```csharp
services.AddSingleton<TodoService>();
```

> Incluir clausula using no início de Startup.cs: ```using TodosAPI.Services;```
> No código anterior, a classe TodoService é registrada com a DI para dar suporte à injeção de construtor nas classes consumidoras. O tempo de vida do serviço singleton é mais apropriado porque TodoService usa uma dependência direta de MongoClient. De acordo com as Diretrizes oficiais de reutilização do cliente Mongo, o MongoClient deve ser registrado na DI com um tempo de vida do serviço singleton.

12. Adicionar um controlador para acessar este serviço. Criar o arquivo TodoController na pasta "Controllers":

```csharp
using TodosAPI.Models;
using TodosAPI.Services;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace TodosApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TodoController : ControllerBase
    {
        private readonly TodoService _todoService;

        public TodoController(TodoService todoService)
        {
            _todoService = todoService;
        }

        [HttpGet]
        public ActionResult<List<Todo>> Get() =>
            _todoService.Get();

        [HttpGet("{id:length(24)}", Name = "GetTodo")]
        public ActionResult<Todo> Get(string id)
        {
            var todo = _todoService.Get(id);

            if (todo == null)
            {
                return NotFound();
            }

            return todo;
        }

        [HttpPost]
        public ActionResult<Todo> Create(Todo todo)
        {
            _todoService.Create(todo);

            return CreatedAtRoute("GetTodo", new { id = todo.Id.ToString() }, todo);
        }

        [HttpPut]
        public IActionResult Update(Todo todoIn)
        {
            var todo = _todoService.Get(todoIn.Id);

            if (todo == null)
            {
                return NotFound();
            }

            _todoService.Update(todoIn);

            return NoContent();
        }

        [HttpDelete("{id:length(24)}")]
        public IActionResult Delete(string id)
        {
            var todo = _todoService.Get(id);

            if (todo == null)
            {
                return NotFound();
            }

            _todoService.Remove(todo.Id);

            return NoContent();
        }
    }
}
```

> O controlador da API Web usa a classe TodoService para executar operações CRUD.

> Ele contém métodos de ação para dar suporte a solicitações GET, POST, PUT e DELETE HTTP.
Chama o CreatedAtRoute no método de ação Create para retornar uma resposta HTTP 201. O código de status 201 é a resposta padrão para um método HTTP POST que cria um recurso no servidor. CreatedAtRoute também adiciona um cabeçalho Location à resposta. O cabeçalho Location especifica o URI do Todo recém-criado.

13. Via linha de comando, compile e execute o projeto:

```
dotnet run
```

14. Testar a API via Postman oou executando direto a URL no browser. Exemplo [
https://localhost:5001/api/todo](
https://localhost:5001/api/todo)

15. Executar requisição POST para a URL https://localhost:5001/api/todo, especificando o sguinte conteúdo como Body:

```javascript
{
	"Title" : "Estudar para Programação Web",
	"CreationDate" : "11/02/2019",
	"Done" : false,
	"Priority" : "Alta"
}
```

16. Voltar para o console do Mongo e executar o seguinte comando:

```
db.Todos.find({}).pretty()
```

> Serão recuperados os documentos recém criados e exibidos em formato JSON:

```javascript
{
        "_id" : ObjectId("5dbe2aaaa9c21148f3162bf1"),
        "Title" : "Estudar para Programação Web",
        "CreationDate" : "11/02/2019",
        "Done" : false,
        "Priority" : "Alta"
}
```

17. Pronto! Vamos subir o código para o repositório. Mas antes de subir o código no Github, crie, na pasta TodosAPI, o seguinte arquivo .gitignore:

```
*.swp
*.*~
project.lock.json
.DS_Store
*.pyc
nupkg/

# Visual Studio Code
.vscode

# Rider
.idea

# User-specific files
*.suo
*.user
*.userosscache
*.sln.docstates

# Build results
[Dd]ebug/
[Dd]ebugPublic/
[Rr]elease/
[Rr]eleases/
x64/
x86/
build/
bld/
[Bb]in/
[Oo]bj/
[Oo]ut/
msbuild.log
msbuild.err
msbuild.wrn

# Visual Studio 2015
.vs/
```

## Etapa 4: Criar Front-End com Angular

1. Abrir o terminal de comando do Visual Studio Code.

2. Instalar o Angular CLI (versão do angular durante a escrita deste documento era a 8):

```bash
npm install -g @angular/cli
```

3. Executar o comando a seguir para criar o projeto:

```bash
ng new TodosWeb
```

> Escolher a opção Angular routing e SCSS para estilos.

4. Após a criação do projeto, acessar a pasta "TodosWeb"

5. Vamos agora adicionar os recursos visuais que iremos utilizar. Vamos adicionar o Angular Material e o Fex Layout:

```bash
ng add @angular/material
ng add @angular/flex-layout
```

> Escolher o tema de preferência. No meu caso vou escolher o Indigo/Pink.

> Optar por configurar HammerJS.

> Optar por incluir animações.

7. Adicionar também o ngx-loading para efeitos de Loading da aplicação:

```
npm add package ngx-loading
```

8. Alterar o app/app.module.ts para adicionar os módulos do Angular Material que irá nos apoiar na parte visual di site. Incluir ainda módulos de formulário do angular:

```javascript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';

import {A11yModule} from '@angular/cdk/a11y';
import {BidiModule} from '@angular/cdk/bidi';
import {ObserversModule} from '@angular/cdk/observers';
import {OverlayModule} from '@angular/cdk/overlay';
import {PlatformModule} from '@angular/cdk/platform';
import {PortalModule} from '@angular/cdk/portal';
import {ScrollDispatchModule} from '@angular/cdk/scrolling';
import {CdkStepperModule} from '@angular/cdk/stepper';
import {CdkTableModule} from '@angular/cdk/table';

import { MatButtonModule, MatCheckboxModule, MatToolbarModule, MatIconModule, MatTableModule, MatFormFieldModule, 
         MatSidenavModule, MatTabsModule, MatInputModule, MatDatepickerModule, MatNativeDateModule,
         MatRadioModule, MatGridListModule, MatCardModule, MatMenuModule, MatPaginatorModule,
         MatSortModule, MatAutocompleteModule, MatButtonToggleModule, MatChipsModule, MatDialogModule,
         MatExpansionModule, MatListModule, MatProgressBarModule,  MatProgressSpinnerModule, MatRippleModule,
         MatSelectModule, MatSliderModule, MatSlideToggleModule, MatSnackBarModule, MatStepperModule, MatTooltipModule
        } from '@angular/material';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxLoadingModule, ngxLoadingAnimationTypes } from 'ngx-loading';

@NgModule({
  exports: [
    // CDK
    A11yModule,
    BidiModule,
    ObserversModule,
    OverlayModule,
    PlatformModule,
    PortalModule,
    ScrollDispatchModule,
    CdkStepperModule,
    CdkTableModule,

    // Material
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatRippleModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatSnackBarModule,
    MatStepperModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule
]})
export class MaterialModule {}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    NgxLoadingModule.forRoot({
      animationType: ngxLoadingAnimationTypes.circle,
      backdropBackgroundColour: 'rgba(0,0,0,0.6)', 
      backdropBorderRadius: '4px',
      primaryColour: '#ffffff', 
      secondaryColour: '#ffffff', 
      tertiaryColour: '#ffffff'
    })  
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

9. Agora podemos adicionar novo componente chamado TodoList. Para tanto, via terminal executar o comando:

```bash
ng g component TodoList
```

> Serão criados vários arquivos do componente além de alterar o app.module.ts:

```
CREATE src/app/todo-list/todo-list.component.html (26 bytes)
CREATE src/app/todo-list/todo-list.component.spec.ts (657 bytes)
CREATE src/app/todo-list/todo-list.component.ts (289 bytes)
CREATE src/app/todo-list/todo-list.component.scss (0 bytes)
UPDATE src/app/app.module.ts (2880 bytes)
```

10. Vamos garantir que o componente foi carregado no módulo correto dentro do app.module.ts. Garanta que o componente "TodoListComponent" está em declarações do módulo que contem o AppComponent:

```javascript
@NgModule({
  declarations: [
    AppComponent,
    TodoListComponent
  ],
...
```

11. Agora vamos incluir uma rota para acessar o componente TodoList. Alterar o arquivo app\app-routing.module.ts:

```javascript
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { TodoListComponent } from './todo-list/todo-list.component';

const routes: Routes = [
  { path:'', component:AppComponent},
  { path:'index.html', component:AppComponent},
  { path:'index', component:AppComponent},
  { path: 'todos', component: TodoListComponent }  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

12. Alterar o arquivo app\app.component.html para remover conteúdo padrão do Angular:

```html
<router-outlet></router-outlet>
```

13. Executar o projeto e testar o caminho [http://localhost:4200/todo](http://localhost:4200/todo)

```
ng serve
```

### 4.2 Customizando o componente TodoList e exibindo dados obtidos da API

1. Agora vamos invocar a API. Mas antes de prosseguirmos, vamos criar o arquivo "todo.js" em "src\app":

```javascript
export class Todo {
    id: string;
    todoTitle: string;
    creationDate: string;
    parsedDate: Date;
    done: boolean;
    priority: number;       
}
```

> Esta classe representa o tipo Todo que iremos manipular no projeto.

2. Agora vamos criar agora um novo serviço que será responsável por fazer a requisição. Acesse o terminal de comando e execute a seguinte instrução na raiz de seu projeto Angular:

```
ng g service Todo
```

> Este comando irá criar novo servilo todo.service.

3. Alterar o app\todo.service.ts para incluir os métodos do CRUD:

```typescript
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
```

4.  Note que estamos usando o módulo HttpClient. Precisamos incluí-lo também em app.module.ts:

> Adicionar logo após as demais cláusulas "import"

```javascript
import { HttpClientModule } from '@angular/common/http';
```

> Adicionar logo após a especificação do import do módulo NgxLoadingModule:

```javascript
HttpClientModule
```

5. Agora, vamos alterar o arquivo "app\todo-list\todo-list.component.html" para incluir os cards de Todo consultados:

```html
<div fxLayout="row wrap" fxLayoutGap="32px" fxLayoutAlign="flex-start">
    <ng-container *ngFor="let item of todoListArray; let itemIndex = index">
        <mat-card class="todoItem">
            <mat-card-header>
                <div mat-card-avatar>
                <span class="md-headline {{item.priority==1 ? 'high' : item.priority==2 ? 'medium' : 'low'}}">
                    <mat-icon>{{ item.priority==1 ? 'error' : item.priority==2 ? 'warning' : 'info'}}</mat-icon>
                </span>
                </div>
                <mat-card-title>
                {{item.todoTitle}}  
                </mat-card-title>
                <mat-card-subtitle>Criado em {{item.creationDate}}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-actions layout="row" align="end">
                <button mat-button (click)="concludeTodo(itemIndex)" >
                    <mat-icon>{{ item.done ? 'delete' : 'check'}}</mat-icon>
                </button>
            </mat-card-actions>
        </mat-card>
    </ng-container>
</div>

<ngx-loading [show]="loading"></ngx-loading>
```

> Note que a ação concludeTodo() que pode ser de deleção ou apenas de conclusão do todo (done = true).

6. Agora vamos alterar o código do componente (src\app\todo-list\todolist.component.ts) para adicionar as funções necessárias para carregar a lista de Todos:

```
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
```

> Note que estamos usando o MatSnackBar para exibir as mensagens de erro e sucesso. É possível aprimorar melhor esse procedimento, mas para o propósito deste tutorial, nos iremos ater a esse nível de feedback.

> Note agora como está implementado o concludeTodo() de forma condicional quanto a atualização para done ou remoção do todo.

7. Adicionalmente, vamos fazer algumas customizações de CSS:

```css
.todoItem {
    margin-bottom: 20px;
    width: 400px;
}

mat-card-header  {
    size: 2em;

    mat-icon {
        font-size: 3em;
    }

    .high {
        color:red;
    }

    .medium {
        color: yellow;
    }

    .low {
        color: lightgreen;
    }
}
```

> Essas regras de estilo são aplicadas especificamente no componente TodoList.

8. Finalizado isto, vamos testar novamente o acesso a esse componente: http://localhost:4200/todos

### 4.3 Adicionando componente para criação/atualização do TODO

1. Adicionar novo componente chamado TodoEditor. Para tanto, via terminal executar o comando:

```bash
ng g component TodoEditor
```

> Serão criados vários arquivos do componente além de alterar o app.module.ts:

```
CREATE src/app/todo-editor/todo-editor.component.html (26 bytes)
CREATE src/app/todo-editor/todo-editor.component.spec.ts (657 bytes)
CREATE src/app/todo-editor/todo-editor.component.ts (289 bytes)
CREATE src/app/todo-editor/todo-editor.component.scss (0 bytes)
UPDATE src/app/app.module.ts (2880 bytes)
```

2. Agora vamos incluir uma rota para acessar o componente TodoEditor. Alterar o arquivo app\app-routing.module.ts:

```javascript
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { TodoListComponent } from './todo-list/todo-list.component';
import { TodoEditorComponent } from './todo-editor/todo-editor.component';

const routes: Routes = [
  { path: '', component: AppComponent},
  { path: 'index.html', component: AppComponent},
  { path: 'index', component: AppComponent},
  { path: 'todos', component: TodoListComponent },
  { path: 'todo/:todoId', component: TodoEditorComponent },
  { path: 'todo', component: TodoEditorComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

```

3. Vamos agora modificar o TodoListComponent para exibir um botão que irá encaminhar o usuário para o TodoEditor. Incluir o seguinte código no começo de todo-list.component.ts:

```html
<mat-card class="todoItem">
    <mat-card-actions layout="row" align="center">
        <button mat-button>
            <a [routerLink]="[ '/todo/']">
                <mat-icon>add</mat-icon> CREATE TODO
            </a>
        </button>
    </mat-card-actions>
</mat-card>
```

> Note que estamos especificando a rota para todo.

4. Vamos agora incluir uma nova ação no TodoListComponent para editar os Todos. Incluir o seguinte código dentro de <mat-card-actions>:

```
<button mat-button>
	<a [routerLink]="[ '/todo', item.id]">
		<mat-icon>edit</mat-icon>
	</a>
</button>
```

> Note que estamos passando um parâmetro id do todo para o path /todo.

5. Agora, vamos alterar o app\todo-editor\todo-editor.component.html para incluir formulário para edição das tarefas:

```html
<mat-card>
  <mat-card-title>
    Tasks
  </mat-card-title>
  <mat-card-content>
    <form [formGroup]="todoForm">
      <input type="hidden" formControlName="id"/>
      <input type="hidden" formControlName="creationDate"/>
      <mat-form-field>
        <input matInput placeholder="Titulo" formControlName="todoTitle">
      </mat-form-field>
      <br/>
      <mat-form-field>
        <input matInput [matDatepicker]="picker" placeholder="Data de criação" formControlName="parsedDate">
        <mat-datepicker-toggle matSuffix [for]="picker" ></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
      <br/>
      <mat-checkbox formControlName="done">Finalizado</mat-checkbox>
      <br/>
      <br/>
      <mat-form-field>
        <mat-label>Prioridade</mat-label>
        <mat-select formControlName="priority">
          <mat-option value="1">
            Alta
          </mat-option>
          <mat-option value="2">
            Média
          </mat-option>
          <mat-option value="3">
            Baixa
          </mat-option>
        </mat-select>
      </mat-form-field>
    </form>
  </mat-card-content>
  <mat-card-actions class="center-text">
      <button mat-raised-button color="primary" class="full-width" (click)="doRequest()" [disabled]="!todoForm.valid">
        SALVAR
      </button>
  </mat-card-actions>
</mat-card>

<ngx-loading [show]="loading"></ngx-loading>
```

4. Note que incluimos a chamada para o método "doRequest()". Esse método deve ser especificado no Javascript referenciado por este HTML. No caso, quando é algo específico para o componente, podemos especificar o "todo-editor.component.ts":

```typescript
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
```

> Note que no ngOnInit, estamos obtendo o parâmetro que foi repassado pelo TodoListComponent.

> Aqui estamos usando também o MatSnackBar para exibir mensagens de sucesso e erro.

5. Pronto! Vamos executar novamente o projeto e testar o caminho [http://localhost:4200/todo](http://localhost:4200/todo)

```
ng serve
```