import { HttpInterceptorFn } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem('token');
  const role = sessionStorage.getItem('role');

  // Skip adding x-user-role header for invoice app endpoints
  if (req.url.includes('localhost:9003')) {
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next(authReq);
    }
    return next(req);
  }

  // For all other endpoints, add both Authorization and x-user-role headers
  if (token) {
    const authReq = req.clone({
      headers: req.headers
        .set('Authorization', `Bearer ${token}`)
        .set('X-User-Role', role || '')
    });
    return next(authReq);
  }

  return next(req);
};