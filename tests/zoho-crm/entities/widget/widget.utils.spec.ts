import { describe, expect, test } from 'bun:test'

import { parseWidgetDescription, resolveWidgetSdkCall, widgetUrlWithServiceOrigin } from '@zoho-studio/zoho-crm/widget'

describe('parseWidgetDescription', () => {
    test('reads the url, location and default scenario', () => {
        expect(
            parseWidgetDescription('card', {
                url: 'http://127.0.0.1:5000/app/widget.html',
                location: 'Custom Button',
                defaultScenario: 'default',
            })
        ).toEqual({
            name: 'card',
            url: 'http://127.0.0.1:5000/app/widget.html',
            location: 'Custom Button',
            defaultScenario: 'default',
        })
    })

    test('names the widget and the field it rejects', () => {
        expect(() => parseWidgetDescription('card', {})).toThrow('widgets/card/widget.json: "url"')
        expect(() => parseWidgetDescription('card', { url: 'http://x', location: 'Sidebar' })).toThrow(
            'widgets/card/widget.json: "location" must be one of'
        )
    })
})

describe('widgetUrlWithServiceOrigin', () => {
    test('keeps the query and the hash of the widget address', () => {
        expect(widgetUrlWithServiceOrigin('http://127.0.0.1:5000/w.html?a=1#tab', 'http://127.0.0.1:4610')).toBe(
            'http://127.0.0.1:5000/w.html?a=1&serviceOrigin=http%3A%2F%2F127.0.0.1%3A4610#tab'
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
