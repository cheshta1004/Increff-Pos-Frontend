import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { UserService } from '../user.service';

@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  private roles: string[] = [];
  private isVisible = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private userService: UserService
  ) {}

  @Input()
  set hasRole(roles: string | string[]) {
    this.roles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  ngOnInit() {
    this.userService.currentUser.subscribe(user => {
      this.updateView();
    });
  }

  private updateView() {
    const user = this.userService.currentUserValue;
    const hasRole = user && user.role && this.roles.includes(user.role);

    if (hasRole && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasRole && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }
} 