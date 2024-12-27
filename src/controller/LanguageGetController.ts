import { DefaultController } from '@ts-core/backend';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Logger, DateUtil } from '@ts-core/common';
import { Cache } from '@ts-core/backend-nestjs';
import { IsOptional, IsString } from 'class-validator';
import { LanguageProjects } from '@ts-core/language';
import * as _ from 'lodash';

// --------------------------------------------------------------------------
//
//  Dto
//
// --------------------------------------------------------------------------

export class LanguageGetDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    version?: string;
}

// --------------------------------------------------------------------------
//
//  Controller
//
// --------------------------------------------------------------------------

export class LanguageGetController<T = any> extends DefaultController<string, T> {

    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    protected cacheTtl: number = DateUtil.MILLISECONDS_DAY;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: Logger, protected cache: Cache, protected language: LanguageProjects) {
        super(logger);
    }

    // --------------------------------------------------------------------------
    //
    //  Private Methods
    //
    // --------------------------------------------------------------------------

    protected getCacheName(project: string, locale: string, version: string): string {
        return `language_${project}_${locale}_${version}`; // Формирование строки имени кэша
    }

    protected getRawTranslated(project: string, locale: string, version?: string): Promise<T> {
        return this.cache.wrap(this.getCacheName(project, locale, version), () => this.language.getRawTranslated(project, locale), this.cacheTtl); // Кэширование результата
    }

    protected getRawTranslation(project: string, locale: string, version?: string): Promise<T> {
        return this.cache.wrap(this.getCacheName(project, locale, version), () => this.language.getRawTranslation(project, locale), this.cacheTtl); // Кэширование результата
    }
}