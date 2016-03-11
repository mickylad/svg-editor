import Tabs from './Tabs';
import TextArea from './TextArea';
import SVGRenderer from './SVGRenderer';
import storage from './storage';
import {Observable, BehaviorSubject} from 'rx';
import {run} from '@cycle/core';
import {makeDOMDriver, div} from '@cycle/dom';

const initialSVGs = [
    { name: 'svg 1', data: '<rect x="5" y="15" height="10" width="10" fill="orange"/>' },
    { name: 'svg 2', data: '<rect x="20" y="25" height="15" width="10" fill="red"/>' }
];

function main(sources) {
    const svgs$ = new BehaviorSubject(storage.get('svg-data') || initialSVGs);
    const names$ = svgs$.map(svgs => svgs.map(svg => svg.name));
    const tabs = Tabs({ DOM: sources.DOM, names$: names$ });

    const selection$ = tabs.selection$;
    const currentData$ = Observable.combineLatest(svgs$, selection$, (svgs, selection) => svgs[selection].data);
    const textArea = TextArea({ DOM: sources.DOM, data$: currentData$ });
    const value$ = textArea.value$;
    const renderer = SVGRenderer({ value$: value$ });

    const input$ = textArea.input$;
    input$.subscribe(function(value) {
        const svgs = svgs$.getValue();
        const selection = selection$.getValue();
        svgs[selection].data = value;
        svgs$.onNext(svgs);
    });

    svgs$.subscribe(function(tabs) {
        storage.set('svg-data', tabs);
    });

    const vtabs$ = tabs.DOM;
    const veditor$ = Observable.combineLatest(textArea.DOM, renderer.DOM, (textArea, renderer) => div('.svg-editor', [textArea, renderer]));
    const vapp$ = Observable.combineLatest(vtabs$, veditor$, (vtabs, veditor) => div('.app', [vtabs, veditor]));
    return {
        DOM: vapp$
    };
}

run(main, { DOM: makeDOMDriver('body') });