<?php

declare(strict_types=1);

namespace Gfh\Core\Support;

use Gfh\Core\App;
use Gfh\Core\Auth\Csrf;
use Gfh\Core\Auth\PasswordPolicy;
use Gfh\Core\Auth\Session;
use Gfh\Core\Database\Database;
use Gfh\Core\Http\Request;
use Gfh\Core\Repository\CustomerAccountRepository;
use Gfh\Core\Repository\LoginAttemptRepository;
use Gfh\Core\Repository\MembershipRepository;
use Gfh\Core\Repository\OrganizationRepository;
use Gfh\Core\Repository\PasswordResetRepository;
use Gfh\Core\Repository\PermissionRepository;
use Gfh\Core\Repository\UserRepository;
use Gfh\Core\Service\AccountService;
use Gfh\Core\Service\AuditService;
use Gfh\Core\Service\AuthService;
use Gfh\Core\Service\PasswordResetService;
use Gfh\Core\Service\PermissionService;
use Gfh\Core\Hooks\Hooks;
use Gfh\Core\Tenancy\Tenant;
use Gfh\Core\Tenancy\TenantResolver;
use Gfh\Core\View\AppView;
use Gfh\Core\View\AssetUrls;
use Gfh\Core\View\TemplateLocator;

/**
 * Builds services on first use and hands out the same instance afterwards: a small, explicit service locator.
 * Web requests use the limited core role. bin/ scripts pass $privileged = true to use the migrator role,
 * because they create accounts and write the registry, which web requests may not.
 */
final class Services
{
    /** @var array<string, object> */
    private array $instances = [];

    public function __construct(private readonly App $app, private readonly bool $privileged = false)
    {
    }

    public function app(): App
    {
        return $this->app;
    }

    public function database(): Database
    {
        return $this->once('database', fn (): Database => new Database($this->app->config()));
    }

    public function core(): \PDO
    {
        return $this->privileged ? $this->database()->coreMigrator() : $this->database()->core();
    }

    public function passwords(): PasswordPolicy
    {
        return $this->once('passwords', static fn (): PasswordPolicy => new PasswordPolicy());
    }

    public function organizations(): OrganizationRepository
    {
        return $this->once('organizations', fn (): OrganizationRepository => new OrganizationRepository($this->core()));
    }

    public function users(): UserRepository
    {
        return $this->once('users', fn (): UserRepository => new UserRepository($this->core()));
    }

    public function customers(): CustomerAccountRepository
    {
        return $this->once('customers', fn (): CustomerAccountRepository => new CustomerAccountRepository($this->core()));
    }

    public function audit(): AuditService
    {
        return $this->once('audit', fn (): AuditService => new AuditService($this->core()));
    }

    public function permissions(): PermissionService
    {
        return $this->once('permissions', fn (): PermissionService => new PermissionService(
            new MembershipRepository($this->core()),
            new PermissionRepository($this->core()),
        ));
    }

    public function auth(): AuthService
    {
        return $this->once('auth', fn (): AuthService => new AuthService(
            $this->users(),
            $this->customers(),
            new LoginAttemptRepository($this->core()),
            $this->audit(),
            $this->passwords(),
            $this->app->config(),
        ));
    }

    public function accounts(): AccountService
    {
        return $this->once('accounts', fn (): AccountService => new AccountService(
            $this->core(),
            $this->users(),
            new MembershipRepository($this->core()),
            $this->permissions(),
            $this->audit(),
            $this->passwords(),
        ));
    }

    public function resets(): PasswordResetService
    {
        return $this->once('resets', fn (): PasswordResetService => new PasswordResetService(
            $this->core(),
            new PasswordResetRepository($this->core()),
            $this->users(),
            $this->customers(),
            $this->accounts(),
            $this->permissions(),
            $this->audit(),
            $this->passwords(),
            $this->app->config(),
        ));
    }

    public function tenants(): TenantResolver
    {
        return $this->once('tenants', fn (): TenantResolver => new TenantResolver(
            $this->organizations(),
            $this->permissions(),
            $this->database(),
        ));
    }

    /** The hook registry shared by every request. Extensions register their callbacks here (Stage 4). */
    public function hooks(): Hooks
    {
        return $this->once('hooks', static fn (): Hooks => new Hooks());
    }

    /** The business services of the organization a request is about. */
    public function forTenant(Tenant $tenant): TenantServices
    {
        return new TenantServices(
            $tenant->database(),
            new AuditService($this->core()),
            $this->hooks(),
            $this->app->path('storage/uploads'),
            $tenant->organization->slug,
        );
    }

    /**
     * The view for one app (admin, shop or pos) of the organization a request is about. Every include follows
     * orgs/{slug}/{app}/... first, then templates/{app}/.... The values every layout needs are shared with all views.
     *
     * @param array<string, mixed> $extra more shared values, for example the navigation items
     */
    public function appView(Tenant $tenant, string $app, Request $request, array $extra = []): AppView
    {
        $slug = $tenant->organization->slug;
        $basePath = $request->basePath();

        return new AppView(new TemplateLocator($this->app->path()), $slug, $app, $extra + [
            'organizationName' => $tenant->organization->name,
            'organizationShortName' => $tenant->organization->shortName,
            'slug' => $slug,
            'basePath' => $basePath,
            'homeUrl' => $basePath . '/' . $slug . '/' . $app,
            'assets' => new AssetUrls($this->app->path('public'), $basePath, $slug, $app),
        ]);
    }

    /** The session for one kind of person. Secure cookies on HTTPS and always in production. */
    public function session(string $scope, Request $request): Session
    {
        return new Session(
            $scope,
            $this->app->config(),
            $this->app->path('storage/sessions'),
            $request->isSecure() || $this->app->config()->isProduction(),
        );
    }

    public function csrf(Session $session): Csrf
    {
        return new Csrf($session);
    }

    /**
     * @template T of object
     * @param callable(): T $make
     * @return T
     */
    private function once(string $key, callable $make): object
    {
        return $this->instances[$key] ??= $make();
    }
}
