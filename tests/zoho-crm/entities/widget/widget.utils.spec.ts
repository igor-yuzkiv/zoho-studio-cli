import { describe, expect, test } from 'bun:test'

import { parseWidgetDescription, resolveWidgetSdkCall, widgetUrlWithServiceOrigin } from '@zoho-studio/zoho-crm/widget'

describe('parseWidgetDescription', () => {
    test('reads the url, location and default scenario', () => {
        expect(
            parseWidgetDescription('card', {
                url: 'http://127.0.0.1:5000/app/widget.html',
                location: 'Custom Button',
                defaultScenario: 'default',
                source: '../deal-card-widget/app',
            })
        ).toEqual({
            name: 'card',
            url: 'http://127.0.0.1:5000/app/widget.html',
            location: 'Custom Button',
            defaultScenario: 'default',
            source: '../deal-card-widget/app',
        })
    })

    test('names the widget and the field it rejects', () => {
        expect(() => parseWidgetDescription('card', {})).toThrow('widgets/card/widget.json: "url"')
        expect(() => parseWidgetDescription('card', { url: 'http://x', source: '' })).toThrow(
            'widgets/card/widget.json: "source" must be the path'
        )
        expect(() => parseWidgetDescription('card', { url: 'http://x', location: 'Sidebar' })).toThrow(
            'widgets/card/widget.json: "location" must be one of'
        )
    })
})

describe('widgetUrlWithServiceOrigin', () => {
    test('puts serviceOrigin last, after a hash router path, where the SDK reads it whole', () => {
        expect(widgetUrlWithServiceOrigin('http://localhost:4203/app/#/routes/shifts', 'http://127.0.0.1:4610')).toBe(
            'http://localhost:4203/app/#/routes/shifts?serviceOrigin=http%3A%2F%2F127.0.0.1%3A4610'
        )
        expect(widgetUrlWithServiceOrigin('http://127.0.0.1:5000/w.html?a=1#tab', 'http://127.0.0.1:4610')).toBe(
            'http://127.0.0.1:5000/w.html?a=1#tab&serviceOrigin=http%3A%2F%2F127.0.0.1%3A4610'
        )
        expect(widgetUrlWithServiceOrigin('http://127.0.0.1:5000/', 'http://127.0.0.1:4610')).toBe(
            'http://127.0.0.1:5000/?serviceOrigin=http%3A%2F%2F127.0.0.1%3A4610'
        )
    })
})

describe('resolveWidgetSdkCall', () => {
    test.each([
        [{ category: 'READ', APIData: { Entity: 'Leads', RecordID: '1' } }, 'API.getRecord'],
        [{ category: 'READ', APIData: { Entity: 'Leads' } }, 'API.getAllRecords'],
        [
            { category: 'READ', APIData: { Entity: 'Leads', RecordID: '1', RelatedListAPIName: 'Notes' } },
            'API.getRelatedRecords',
        ],
        [
            { category: 'READ', APIData: { Entity: 'Leads', RecordID: '1', RelatedList: 'Notes' } },
            'API.getRelatedRecords',
        ],
        [{ category: 'CREATE', type: 'RECORD', APIData: { action: 'UPSERT' } }, 'API.upsertRecord'],
        [{ category: 'UPDATE', type: 'RECORD' }, 'API.updateRecord'],
        [{ category: 'META', type: 'FIELD_LIST', Entity: 'Leads' }, 'META.getFields'],
        [{ category: 'CONFIG', type: 'ORG' }, 'CONFIG.getOrgInfo'],
        [{ category: 'UI', action: 'RESIZE' }, 'UI.Resize'],
        [{ category: 'UI', action: { record: 'OPEN' } }, 'UI.Record.open'],
        [{ category: 'CONNECTOR', nameSpace: 'wget.post' }, 'HTTP.post'],
        [{ category: 'CRM_CONNECTION', connectionName: 'erp' }, 'CONNECTION.invoke'],
    ])('%o is %s', (data, method) => {
        expect(resolveWidgetSdkCall(data)).toEqual({ method, supported: true })
    })

    test('marks what the studio does not run as unsupported', () => {
        expect(resolveWidgetSdkCall({ category: 'FUNCTIONS_EXECUTE' })).toEqual({
            method: 'FUNCTIONS.execute',
            supported: false,
        })
        expect(resolveWidgetSdkCall({ category: 'ZRC_REQUEST' })).toEqual({ method: 'zrc', supported: false })
    })
})
