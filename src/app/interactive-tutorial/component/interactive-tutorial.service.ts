import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
@Injectable({
    providedIn: 'root',
  })
  export class interactiveTutorialService {
    private jsonUrl = 'assets/interactive-tutorial.json';
  
    constructor(private http: HttpClient) {}
  
    getInteractiveTutorialConstants(): Observable<any> {
        console.log("inside getInteractiveTutorialConstants");
      return this.http.get<any>(this.jsonUrl);
    }
  }
  