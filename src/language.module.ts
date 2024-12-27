import { DynamicModule, Type, Provider } from '@nestjs/common';
import { LanguageProjects, ILanguageProjectSettings } from '@ts-core/language';
import { CacheModule } from '@ts-core/backend-nestjs';
import { CloneUtil } from '@ts-core/common';
import { FileUtil } from '@ts-core/backend';
import * as _ from 'lodash';

export class LanguageModule {
    // --------------------------------------------------------------------------
    //
    //  Public Static Methods
    //
    // --------------------------------------------------------------------------

    public static forRoot(settings: ILanguageModuleSettings): DynamicModule {
        let imports: Array<Type> = [CacheModule];
        let providers: Array<Provider> = [
            {
                provide: LanguageProjects,
                useFactory: async () => {
                    let item = new LanguageProjects(LanguageLoadTranslationRawFunction);
                    await item.load(settings.path, settings.projects);
                    return item;
                }
            }
        ]
        return {
            global: true,
            module: LanguageModule,
            exports: providers,
            providers,
            imports,
        };
    }
}
export interface ILanguageModuleSettings {
    path: string;
    projects: Array<ILanguageProjectSettings>;
}

export async function LanguageLoadTranslationRawFunction<T = any>(path: string, project: string, locale: string, prefixes: Array<string>): Promise<T> {
    let raw = {} as T;
    let items = await Promise.all(prefixes.map(name => FileUtil.jsonRead(`${path}/${project}/${locale}${name}`)));
    items.forEach(file => CloneUtil.deepExtend(raw, file));
    return raw;
}
