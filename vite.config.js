import { defineConfig } from 'vite';
import Vue from '@vitejs/plugin-vue';
import path from 'path';
import copy from 'rollup-plugin-copy';
import commonjs from '@rollup/plugin-commonjs';
import i18nExtractKeys from './lib/pkp/tools/i18nExtractKeys.vite.js';

const basePath = '/Users/abir/Sites/code/ojs-main/lib/ui-library/node_modules';

export default defineConfig(({ mode }) => {
  process.env.NODE_ENV = mode;
  return {
    plugins: [
      i18nExtractKeys({
        extraKeys: [
          'common.view',
          'common.close',
          'common.editItem',
          'stats.descriptionForStat',
          'common.commaListSeparator',
          'form.dataHasChanged',
        ],
      }),
      Vue({
        isProduction: mode === 'production',
        template: { compilerOptions: { whitespace: 'preserve' } },
      }),
      copy({
        targets: [
          { src: 'lib/ui-library/public/styles/tinymce/*', dest: 'lib/pkp/styles/tinymce' },
          { src: 'node_modules/jquery/dist/*', dest: 'js/build/jquery' },
          { src: 'node_modules/jquery-ui/dist/**/*.js', dest: 'js/build/jquery-ui' },
          { src: 'node_modules/jquery-validation/dist/*', dest: 'js/build/jquery-validation' },
          { src: 'node_modules/chart.js/dist/**/*.umd.js', dest: 'js/build/chart.js' },
          { src: `${basePath}/@sciflow/component-demo/styles.css`, dest: 'js/build/sciflow' },
        ],
        hook: 'writeBundle',
      }),
      {
        name: 'transform-angular-subpaths',
        transform(code, id) {
          if (id.includes('@angular/') && id.endsWith('.mjs')) {
            const subpathMap = {
              '@angular/common/http': `${basePath}/@angular/common/fesm2022/http.mjs`,
              '@angular/core/primitives/signals': `${basePath}/@angular/core/fesm2022/primitives/signals.mjs`,
              '@angular/core/primitives/di': `${basePath}/@angular/core/fesm2022/primitives/di.mjs`,
              '@angular/cdk/a11y': `${basePath}/@angular/cdk/fesm2022/a11y.mjs`,
              '@angular/cdk/private': `${basePath}/@angular/cdk/fesm2022/private.mjs`,
              '@angular/cdk/platform': `${basePath}/@angular/cdk/fesm2022/platform.mjs`,
              '@angular/cdk/coercion': `${basePath}/@angular/cdk/fesm2022/coercion.mjs`,
              '@angular/cdk/bidi': `${basePath}/@angular/cdk/fesm2022/bidi.mjs`,
              '@angular/cdk/overlay': `${basePath}/@angular/cdk/fesm2022/overlay.mjs`,
              '@angular/cdk/scrolling': `${basePath}/@angular/cdk/fesm2022/scrolling.mjs`,
              '@angular/cdk/accordion': `${basePath}/@angular/cdk/fesm2022/accordion.mjs`,
              '@angular/cdk/clipboard': `${basePath}/@angular/cdk/fesm2022/clipboard.mjs`,
              '@angular/cdk/collections': `${basePath}/@angular/cdk/fesm2022/collections.mjs`,
              '@angular/cdk/dialog': `${basePath}/@angular/cdk/fesm2022/dialog.mjs`,
              '@angular/cdk/drag-drop': `${basePath}/@angular/cdk/fesm2022/drag-drop.mjs`,
              '@angular/cdk/keycodes': `${basePath}/@angular/cdk/fesm2022/keycodes.mjs`,
              '@angular/cdk/layout': `${basePath}/@angular/cdk/fesm2022/layout.mjs`,
              '@angular/cdk/listbox': `${basePath}/@angular/cdk/fesm2022/listbox.mjs`,
              '@angular/cdk/menu': `${basePath}/@angular/cdk/fesm2022/menu.mjs`,
              '@angular/cdk/observers': `${basePath}/@angular/cdk/fesm2022/observers.mjs`,
              '@angular/cdk/portal': `${basePath}/@angular/cdk/fesm2022/portal.mjs`,
              '@angular/cdk/stepper': `${basePath}/@angular/cdk/fesm2022/stepper.mjs`,
              '@angular/cdk/table': `${basePath}/@angular/cdk/fesm2022/table.mjs`,
              '@angular/cdk/testing': `${basePath}/@angular/cdk/fesm2022/testing.mjs`,
              '@angular/cdk/text-field': `${basePath}/@angular/cdk/fesm2022/text-field.mjs`,
              '@angular/cdk/tree': `${basePath}/@angular/cdk/fesm2022/tree.mjs`,
            };
            let transformedCode = code;

            for (const [subpath, absolutePath] of Object.entries(subpathMap)) {
              const namedImportRegex = new RegExp(`import\\s+([^;]+?)\\s+from\\s+['"]${subpath}['"]`, 'g');
              const bareImportRegex = new RegExp(`import\\s+['"]${subpath}['"]`, 'g');

              transformedCode = transformedCode
                .replace(namedImportRegex, `import $1 from '${absolutePath}'`)
                .replace(bareImportRegex, `import '${absolutePath}'`);
            }

            if (transformedCode !== code) {
              console.log(`Patched imports in ${id}`);
              return { code: transformedCode, map: null };
            }
          }
          return null;
        },
      },
      {
        name: 'fix-sciflow-schema',
        transform(code, id) {
          if (id.includes('@sciflow/schema/src/lib/schema.js')) {
            console.log(`Patching ${id}`);
            return {
              code: code.replace('exports.schema =', 'export const schema ='),
              map: null,
            };
          }
          if (id.includes('@sciflow/schema/src/lib/types.js')) {
            console.log(`Patching ${id}`);
            return {
              code: code.replace(
                /(var SFNodeType;\s*\(function \(SFNodeType\) {[\s\S]*?\}\)\(SFNodeType \|\| \(exports\.SFNodeType = SFNodeType = {}\)\);)/,
                'export let SFNodeType = {}; (function (SFNodeType) { $1 })(SFNodeType);'
              ),
              map: null,
            };
          }
          if (id.includes('@sciflow/schema/src/index.js')) {
            console.log(`Patching ${id}`);
            return {
              code: `
                export { schema } from './lib/schema';
                export { SFNodeType } from './lib/types';
              `,
              map: null,
            };
          }
          return null;
        },
      },
      {
        name: 'fix-sciflow-editor',
        transform(code, id) {
          if (id.includes('@sciflow/editor/src/lib/editor.js')) {
            console.log(`Patching ${id}`);
            return {
              code: code
                .replace('exports.createView = void 0;', '')
                .replace('exports.createView = createView;', 'export { createView };'),
              map: null,
            };
          }
          if (id.includes('@sciflow/editor/src/lib/commands.js')) {
            console.log(`Patching ${id}`);
            return {
              code: code
                .replace('exports.setAttrsChecked = void 0;', '')
                .replace('exports.setAttrsChecked = setAttrsChecked;', 'export { setAttrsChecked };'),
              map: null,
            };
          }
          if (id.includes('@sciflow/editor/src/lib/helpers.js')) {
            console.log(`Patching ${id}`);
            return {
              code: code
                .replace('exports.attrSpecToJsonSchema = void 0;', '')
                .replace('exports.attrSpecToJsonSchema = attrSpecToJsonSchema;', 'export { attrSpecToJsonSchema };'),
              map: null,
            };
          }
          return null;
        },
      },
      {
        name: 'fix-ajv-esm',
        transform(code, id) {
          if (id.includes('ajv/dist/ajv.js')) {
            console.log(`Patching ${id}`);
            return {
              code: code.replace('exports.default = Ajv;', 'export default Ajv;'),
              map: null,
            };
          }
          return null;
        },
      },
      commonjs({
        include: [
          path.resolve(__dirname, 'lib/ui-library/node_modules/@sciflow/ui/fesm2022/sciflow-ui.mjs'),
          path.resolve(__dirname, 'lib/ui-library/node_modules/tslib'),
        ],
        exclude: [
          path.resolve(__dirname, 'lib/ui-library/node_modules/ajv/**/*'),
          path.resolve(__dirname, 'lib/ui-library/node_modules/@sciflow/schema/**/*'),
          path.resolve(__dirname, 'lib/ui-library/node_modules/@sciflow/editor/**/*'),
        ],
        transformMixedEsModules: true,
        sourceMap: true,
      }),
    ],
    publicDir: false,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'lib/ui-library/src'),
        'vue': 'vue/dist/vue.esm-bundler.js',
        '~sciflow': path.resolve(__dirname, 'lib/ui-library/node_modules/@sciflow/component-demo'),
        '@sciflow': path.resolve(__dirname, 'lib/ui-library/node_modules/@sciflow'),
        '@sciflow/ui': path.resolve(__dirname, 'lib/ui-library/node_modules/@sciflow/ui/fesm2022/sciflow-ui.mjs'),
        '@sciflow/editor': path.resolve(__dirname, 'lib/ui-library/node_modules/@sciflow/editor/src/index.js'),
        '@sciflow/schema': path.resolve(__dirname, 'lib/ui-library/node_modules/@sciflow/schema/src/index.js'),
        '@angular/core': `${basePath}/@angular/core/fesm2022/core.mjs`,
        '@angular/common': `${basePath}/@angular/common/fesm2022/common.mjs`,
        '@angular/common/http': `${basePath}/@angular/common/fesm2022/http.mjs`,
        '@angular/forms': `${basePath}/@angular/forms/fesm2022/forms.mjs`,
        '@angular/elements': `${basePath}/@angular/elements/fesm2022/elements.mjs`,
        '@angular/compiler': `${basePath}/@angular/compiler/fesm2022/compiler.mjs`,
        '@angular/platform-browser': `${basePath}/@angular/platform-browser/fesm2022/platform-browser.mjs`,
        '@angular/platform-browser-dynamic': `${basePath}/@angular/platform-browser-dynamic/fesm2022/platform-browser-dynamic.mjs`,
        '@angular/cdk': path.resolve(__dirname, 'lib/ui-library/node_modules/@angular/cdk'),
        'tslib': path.resolve(__dirname, 'lib/ui-library/node_modules/tslib/tslib.es6.js'),
        'ajv': path.resolve(__dirname, 'lib/ui-library/node_modules/ajv/dist/ajv.js'),
        'zone.js': path.resolve(__dirname, 'lib/ui-library/node_modules/zone.js/fesm2015/zone.js'), // Add zone.js alias
        'prosemirror-commands': path.resolve(__dirname, 'lib/ui-library/node_modules/prosemirror-commands'),
        'prosemirror-dropcursor': path.resolve(__dirname, 'lib/ui-library/node_modules/prosemirror-dropcursor'),
        'prosemirror-gapcursor': path.resolve(__dirname, 'lib/ui-library/node_modules/prosemirror-gapcursor'),
        'prosemirror-keymap': path.resolve(__dirname, 'lib/ui-library/node_modules/prosemirror-keymap'),
        'prosemirror-example-setup': path.resolve(__dirname, 'lib/ui-library/node_modules/prosemirror-example-setup'),
        'prosemirror-model': path.resolve(__dirname, 'lib/ui-library/node_modules/prosemirror-model'),
        'prosemirror-schema-basic': path.resolve(__dirname, 'lib/ui-library/node_modules/prosemirror-schema-basic'),
        'prosemirror-schema-list': path.resolve(__dirname, 'lib/ui-library/node_modules/prosemirror-schema-list'),
        'prosemirror-state': path.resolve(__dirname, 'lib/ui-library/node_modules/prosemirror-state'),
        'prosemirror-view': path.resolve(__dirname, 'lib/ui-library/node_modules/prosemirror-view'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
      mainFields: ['module', 'main'],
      conditions: ['module', 'import', 'default'],
      dedupe: [
        '@headlessui/vue',
        '@lk77/vue3-color',
        'tinymce/tinymce-vue',
        '@vue-a11y/announcer',
        '@vueuse/core',
        'chart.js',
        'clone-deep',
        'copyfiles',
        'debounce',
        'dropzone-vue3',
        'element-resize-event',
        'floating-vue',
        'highlight.js',
        'ofetch',
        'pinia',
        'swiper',
        'tiny-emitter',
        'tinymce',
        'uuid',
        'vue',
        'vue-chartjs',
        'vue-draggable-plus',
        'vue-scrollto',
        'vue3-highlightjs',
      ],
    },
    optimizeDeps: {
      exclude: ['@sciflow/component-demo'],
      include: [
        '@angular/core',
        '@angular/common',
        '@angular/common/http',
        '@angular/forms',
        '@angular/elements',
        '@angular/compiler',
        '@angular/platform-browser',
        '@angular/platform-browser-dynamic',
        '@sciflow/ui',
        '@sciflow/editor',
        '@sciflow/schema',
        '@json-editor/json-editor',
        '@angular/cdk',
        'tslib',
        'ajv',
        'zone.js', // Add zone.js to optimizeDeps
        'prosemirror-commands',
        'prosemirror-dropcursor',
        'prosemirror-gapcursor',
        'prosemirror-keymap',
        'prosemirror-example-setup',
        'prosemirror-model',
        'prosemirror-schema-basic',
        'prosemirror-schema-list',
        'prosemirror-state',
        'prosemirror-view',
      ],
    },
    build: {
      sourcemap: mode === 'development' ? 'inline' : true,
      target: ['chrome66', 'edge79', 'firefox67', 'safari12'],
      emptyOutDir: false,
      cssCodeSplit: false,
      rollupOptions: {
        input: { build: './js/load.js' },
        output: {
          format: 'iife',
          entryFileNames: 'js/build.js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const extType = info[info.length - 1];
            if (/\.(css)$/.test(assetInfo.name)) {
              return 'styles/build.css';
            }
            return `[name].${extType}`;
          },
          globals: {
            'vue': 'pkp.Vue',
            '@sciflow/ui': 'sciflowUI',
            '@sciflow/editor': 'sciflowEditor',
            '@sciflow/schema': 'sciflowSchema',
            '@angular/core': 'ngCore',
            '@angular/common': 'ngCommon',
            '@angular/common/http': 'ngHttp',
            '@angular/forms': 'ngForms',
            '@angular/elements': 'ngElements',
            '@angular/compiler': 'ngCompiler',
            '@angular/platform-browser': 'ngPlatformBrowser',
            '@angular/platform-browser-dynamic': 'ngPlatformBrowserDynamic',
            '@json-editor/json-editor': 'jsonEditor',
            'tslib': 'tslib',
            'ajv': 'Ajv',
            'zone.js': 'Zone', // Add zone.js global
            'prosemirror-commands': 'ProseMirrorCommands',
            'prosemirror-dropcursor': 'ProseMirrorDropCursor',
            'prosemirror-gapcursor': 'ProseMirrorGapCursor',
            'prosemirror-keymap': 'ProseMirrorKeymap',
            'prosemirror-example-setup': 'ProseMirrorExampleSetup',
            'prosemirror-model': 'ProseMirrorModel',
            'prosemirror-schema-basic': 'ProseMirrorSchemaBasic',
            'prosemirror-schema-list': 'ProseMirrorSchemaList',
            'prosemirror-state': 'ProseMirrorState',
            'prosemirror-view': 'ProseMirrorView',
          },
          inlineDynamicImports: true,
        },
        external: [
          '@sciflow/component-demo/polyfills.js',
          '@sciflow/component-demo/main.js',
          '@sciflow/component-demo/styles.css',
        ],
        onwarn(warning, warn) {
          if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message.includes('luxon')) {
            return;
          }
          if (warning.code === 'THIS_IS_UNDEFINED' && warning.id.includes('tinymce-vue')) {
            return;
          }
          console.log('Rollup warning:', warning);
          warn(warning);
        },
      },
      outDir: path.resolve(__dirname),
    },
  };
});
