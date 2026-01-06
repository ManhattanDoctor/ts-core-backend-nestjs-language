# @ts-core/backend-nestjs-language

NestJS модуль для поддержки многоязычности (i18n) в серверных приложениях. Предоставляет глобальный модуль для загрузки переводов из файлов и контроллер для отдачи переводов клиенту с кешированием.

## Содержание

- [Установка](#установка)
- [Зависимости](#зависимости)
- [Быстрый старт](#быстрый-старт)
- [Настройка модуля](#настройка-модуля)
- [Контроллер переводов](#контроллер-переводов)
- [Структура файлов переводов](#структура-файлов-переводов)
- [Кеширование](#кеширование)
- [Примеры использования](#примеры-использования)
- [Связанные пакеты](#связанные-пакеты)

## Установка

```bash
npm install @ts-core/backend-nestjs-language
```

```bash
yarn add @ts-core/backend-nestjs-language
```

```bash
pnpm add @ts-core/backend-nestjs-language
```

## Зависимости

| Пакет | Описание |
|-------|----------|
| `@ts-core/language` | Базовые классы для работы с переводами |
| `@ts-core/backend-nestjs` | NestJS утилиты (включая Cache) |
| `@nestjs/swagger` | Swagger декораторы для API |

## Быстрый старт

### Подключение модуля

```typescript
import { Module } from '@nestjs/common';
import { LanguageModule } from '@ts-core/backend-nestjs-language';

@Module({
    imports: [
        LanguageModule.forRoot({
            path: './assets/locale',
            projects: [
                {
                    name: 'main',
                    locales: ['ru', 'en'],
                    prefixes: ['.json']
                }
            ]
        })
    ]
})
export class AppModule {}
```

### Структура файлов

```
assets/
└── locale/
    └── main/
        ├── ru.json
        └── en.json
```

### Файл перевода (ru.json)

```json
{
    "greeting": "Привет",
    "welcome": "Добро пожаловать, {{name}}!",
    "buttons": {
        "save": "Сохранить",
        "cancel": "Отмена"
    }
}
```

## Настройка модуля

### ILanguageModuleSettings

```typescript
interface ILanguageModuleSettings {
    path: string;                                    // Путь к директории с переводами
    projects: Array<ILanguageProjectSettings>;       // Настройки проектов
    loadRawFunction?: LoadRawFunction;               // Функция загрузки (опционально)
}

interface ILanguageProjectSettings {
    name: string;           // Имя проекта
    locales: string[];      // Поддерживаемые локали
    prefixes: string[];     // Суффиксы файлов (например ['.json'])
}
```

### Пример с несколькими проектами

```typescript
import { Module } from '@nestjs/common';
import { LanguageModule } from '@ts-core/backend-nestjs-language';

@Module({
    imports: [
        LanguageModule.forRoot({
            path: './assets/locale',
            projects: [
                {
                    name: 'common',
                    locales: ['ru', 'en', 'de'],
                    prefixes: ['.json']
                },
                {
                    name: 'admin',
                    locales: ['ru', 'en'],
                    prefixes: ['.json', '-admin.json']
                },
                {
                    name: 'mobile',
                    locales: ['ru', 'en'],
                    prefixes: ['.json']
                }
            ]
        })
    ]
})
export class AppModule {}
```

### Структура для нескольких проектов

```
assets/
└── locale/
    ├── common/
    │   ├── ru.json
    │   ├── en.json
    │   └── de.json
    ├── admin/
    │   ├── ru.json
    │   ├── ru-admin.json
    │   ├── en.json
    │   └── en-admin.json
    └── mobile/
        ├── ru.json
        └── en.json
```

### Пользовательская функция загрузки

```typescript
import { LanguageModule } from '@ts-core/backend-nestjs-language';

async function customLoadFunction<T>(
    path: string,
    project: string,
    locale: string,
    prefixes: string[]
): Promise<T> {
    // Загрузка из базы данных, Redis или другого источника
    const translations = await database.getTranslations(project, locale);
    return translations as T;
}

@Module({
    imports: [
        LanguageModule.forRoot({
            path: './assets/locale',
            projects: [{ name: 'main', locales: ['ru', 'en'], prefixes: ['.json'] }],
            loadRawFunction: customLoadFunction
        })
    ]
})
export class AppModule {}
```

## Контроллер переводов

### LanguageGetController

Базовый контроллер для отдачи переводов клиенту:

```typescript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { LanguageGetController, LanguageGetDto } from '@ts-core/backend-nestjs-language';
import { Cache } from '@ts-core/backend-nestjs';
import { LanguageProjects } from '@ts-core/language';
import { Logger } from '@ts-core/common';

@Controller('language')
export class AppLanguageController extends LanguageGetController {
    constructor(logger: Logger, cache: Cache, language: LanguageProjects) {
        super(logger, cache, language);
    }

    @Get(':project/:locale')
    async get(
        @Param('project') project: string,
        @Param('locale') locale: string,
        @Query() dto: LanguageGetDto
    ): Promise<any> {
        return this.getRawTranslated(project, locale, dto.version);
    }
}
```

### LanguageGetDto

```typescript
class LanguageGetDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    version?: string;   // Версия для инвалидации кеша
}
```

### Методы контроллера

| Метод | Описание |
|-------|----------|
| `getRawTranslated(project, locale, version?)` | Получить переводы с подстановкой вложенных ключей |
| `getRawTranslation(project, locale, version?)` | Получить сырые переводы без обработки |

## Структура файлов переводов

### Базовая структура

```json
{
    "greeting": "Привет",
    "farewell": "До свидания"
}
```

### Вложенные ключи

```json
{
    "user": {
        "profile": {
            "title": "Профиль пользователя",
            "settings": "Настройки"
        },
        "actions": {
            "edit": "Редактировать",
            "delete": "Удалить"
        }
    }
}
```

### Переменные в переводах

```json
{
    "welcome": "Добро пожаловать, {{name}}!",
    "itemCount": "У вас {{count}} новых сообщений",
    "order": {
        "status": "Заказ #{{orderId}} {{status}}"
    }
}
```

### Ссылки на другие ключи

```json
{
    "appName": "МоёПриложение",
    "welcome": "Добро пожаловать в {{appName}}!",
    "footer": "© 2024 {{appName}}"
}
```

## Кеширование

Контроллер автоматически кеширует переводы с TTL по умолчанию 24 часа:

```typescript
export class LanguageGetController<T = any> {
    protected cacheTtl: number = DateUtil.MILLISECONDS_DAY;  // 86400000 мс

    protected getCacheName(project: string, locale: string, version: string): string {
        return `language_${project}_${locale}_${version}`;
    }
}
```

### Настройка TTL кеша

```typescript
@Controller('language')
export class AppLanguageController extends LanguageGetController {
    constructor(logger: Logger, cache: Cache, language: LanguageProjects) {
        super(logger, cache, language);
        this.cacheTtl = DateUtil.MILLISECONDS_HOUR;  // 1 час
    }
}
```

### Инвалидация кеша через версию

```typescript
// Клиент запрашивает с версией
GET /language/main/ru?version=1.2.3

// При обновлении версии кеш автоматически обновляется
GET /language/main/ru?version=1.2.4
```

## Примеры использования

### Полный пример настройки

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { LanguageModule } from '@ts-core/backend-nestjs-language';
import { CacheModule } from '@ts-core/backend-nestjs';
import { AppLanguageController } from './language.controller';

@Module({
    imports: [
        CacheModule,
        LanguageModule.forRoot({
            path: './assets/locale',
            projects: [
                {
                    name: 'web',
                    locales: ['ru', 'en', 'de', 'fr'],
                    prefixes: ['.json']
                },
                {
                    name: 'api-errors',
                    locales: ['ru', 'en'],
                    prefixes: ['.json']
                }
            ]
        })
    ],
    controllers: [AppLanguageController]
})
export class AppModule {}
```

```typescript
// language.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LanguageGetController, LanguageGetDto } from '@ts-core/backend-nestjs-language';
import { Cache } from '@ts-core/backend-nestjs';
import { LanguageProjects } from '@ts-core/language';
import { Logger } from '@ts-core/common';

@ApiTags('Language')
@Controller('language')
export class AppLanguageController extends LanguageGetController {
    constructor(logger: Logger, cache: Cache, language: LanguageProjects) {
        super(logger, cache, language);
    }

    @Get(':project/:locale')
    @ApiOperation({ summary: 'Получить переводы' })
    @ApiParam({ name: 'project', example: 'web' })
    @ApiParam({ name: 'locale', example: 'ru' })
    @ApiQuery({ name: 'version', required: false })
    async getTranslations(
        @Param('project') project: string,
        @Param('locale') locale: string,
        @Query() dto: LanguageGetDto
    ): Promise<any> {
        return this.getRawTranslated(project, locale, dto.version);
    }
}
```

### Использование LanguageProjects в сервисах

```typescript
import { Injectable } from '@nestjs/common';
import { LanguageProjects } from '@ts-core/language';

@Injectable()
export class NotificationService {
    constructor(private language: LanguageProjects) {}

    async sendWelcomeEmail(user: User): Promise<void> {
        const translations = await this.language.getRawTranslated('web', user.locale);

        const subject = this.interpolate(translations.email.welcome.subject, {
            appName: 'MyApp'
        });

        const body = this.interpolate(translations.email.welcome.body, {
            name: user.name
        });

        await this.mailer.send({ to: user.email, subject, body });
    }

    private interpolate(template: string, data: Record<string, any>): string {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
    }
}
```

### Файлы переводов для разных проектов

```json
// assets/locale/web/ru.json
{
    "nav": {
        "home": "Главная",
        "about": "О нас",
        "contact": "Контакты"
    },
    "auth": {
        "login": "Войти",
        "logout": "Выйти",
        "register": "Регистрация"
    },
    "email": {
        "welcome": {
            "subject": "Добро пожаловать в {{appName}}!",
            "body": "Привет, {{name}}! Рады видеть вас."
        }
    }
}
```

```json
// assets/locale/api-errors/ru.json
{
    "validation": {
        "required": "Поле обязательно для заполнения",
        "email": "Некорректный email адрес",
        "minLength": "Минимальная длина: {{min}} символов"
    },
    "auth": {
        "invalidCredentials": "Неверный логин или пароль",
        "tokenExpired": "Сессия истекла",
        "accessDenied": "Доступ запрещён"
    },
    "notFound": {
        "user": "Пользователь не найден",
        "order": "Заказ не найден"
    }
}
```

## API Reference

### LanguageModule

| Метод | Описание |
|-------|----------|
| `forRoot(settings)` | Создать глобальный модуль с настройками |

### LanguageGetController

| Свойство/Метод | Тип | Описание |
|----------------|-----|----------|
| `cacheTtl` | `number` | TTL кеша в миллисекундах |
| `getCacheName(project, locale, version)` | `string` | Формирование ключа кеша |
| `getRawTranslated(project, locale, version?)` | `Promise<T>` | Получить обработанные переводы |
| `getRawTranslation(project, locale, version?)` | `Promise<T>` | Получить сырые переводы |

### LanguageProjects (из @ts-core/language)

| Метод | Описание |
|-------|----------|
| `load(path, projects)` | Загрузить переводы из файлов |
| `getRawTranslated(project, locale)` | Получить обработанные переводы |
| `getRawTranslation(project, locale)` | Получить сырые переводы |

## Связанные пакеты

| Пакет | Описание |
|-------|----------|
| `@ts-core/language` | Базовые классы для работы с переводами |
| `@ts-core/backend-nestjs` | NestJS утилиты (Cache, Logger, etc.) |

## Автор

**Renat Gubaev** — [renat.gubaev@gmail.com](mailto:renat.gubaev@gmail.com)

- GitHub: [ManhattanDoctor](https://github.com/ManhattanDoctor)
- Репозиторий: [ts-core-backend-nestjs-language](https://github.com/ManhattanDoctor/ts-core-backend-nestjs-language)

## Лицензия

ISC
