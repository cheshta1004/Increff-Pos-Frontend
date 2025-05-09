import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';

export const roleGuard = (allowedRoles: string[]) => {
  return () => {
    const userService = inject(UserService);
    const router = inject(Router);
    const user = userService.currentUserValue;
    
    if (user && user.role && allowedRoles.includes(user.role)) {
      return true;
    }
    
    // Redirect to unauthorized page
    router.navigate(['/unauthorized']);
    return false;
  };
}; 