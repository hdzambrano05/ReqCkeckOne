import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth-guard';
import { AuthService } from '../services/auth';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: AuthService;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    // Creamos un spy para Router
    const spyRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        AuthService,
        { provide: Router, useValue: spyRouter }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access if user is logged in', () => {
    // Espiamos el método isLoggedIn
    spyOn(authService, 'isLoggedIn').and.returnValue(true);

    const result = guard.canActivate();
    expect(result).toBeTrue();
  });

  it('should redirect to login if user is not logged in', () => {
    spyOn(authService, 'isLoggedIn').and.returnValue(false);

    const result = guard.canActivate();
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['login']);
  });
});
