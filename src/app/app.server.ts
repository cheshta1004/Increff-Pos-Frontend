import { renderApplication } from '@angular/platform-server';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { config } from './app.config.server';

export async function renderApp(url: string) {
  return renderApplication(() => bootstrapApplication(AppComponent, config), {
    url,
    document: '<app-root></app-root>'
  });
} 