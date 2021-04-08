/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Orientation, Sizing, SplitView } from 'vs/base/browser/ui/splitview/splitview';
import { Disposable } from 'vs/base/common/lifecycle';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ITerminalService } from 'vs/workbench/contrib/terminal/browser/terminal';
import { TerminalTabsWidget } from 'vs/workbench/contrib/terminal/browser/terminalTabsWidget';

export class TerminalTabbedView extends Disposable {

	private _splitView: SplitView;

	private _terminalContainer: HTMLElement;
	private _terminalTabTree: HTMLElement;
	private _tabsWidget: TerminalTabsWidget | undefined;

	private _tabTreeIndex: number;
	private _terminalContainerIndex: number;

	private _showTabs: boolean;

	private _height: number | undefined;

	private _instantiationService: IInstantiationService;
	private _terminalService: ITerminalService;

	constructor(
		parentElement: HTMLElement,
		@ITerminalService terminalService: ITerminalService,
		@IConfigurationService configurationService: IConfigurationService,
		@IInstantiationService instantiationService: IInstantiationService
	) {
		super();

		this._instantiationService = instantiationService;
		this._terminalService = terminalService;

		this._terminalTabTree = document.createElement('div');
		this._terminalTabTree.classList.add('tabs-widget');
		this._tabsWidget = this._instantiationService.createInstance(TerminalTabsWidget, this._terminalTabTree);

		this._terminalContainer = document.createElement('div');
		this._terminalContainer.classList.add('terminal-outer-container');
		this._terminalContainer.style.display = 'block';

		this._showTabs = terminalService.configHelper.config.showTabs;

		this._tabTreeIndex = terminalService.configHelper.config.tabsLocation === 'left' ? 0 : 1;
		this._terminalContainerIndex = terminalService.configHelper.config.tabsLocation === 'left' ? 1 : 0;

		terminalService.setContainers(parentElement, this._terminalContainer);

		configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('terminal.integrated.showTabs')) {
				this._showTabs = terminalService.configHelper.config.showTabs;
				if (this._showTabs) {
					this._splitView.addView({
						element: this._terminalTabTree,
						layout: width => this._tabsWidget!.layout(this._height, width),
						minimumSize: 40,
						maximumSize: Number.POSITIVE_INFINITY,
						onDidChange: () => Disposable.None,
					}, Sizing.Distribute, this._tabTreeIndex);
				} else {
					this._splitView.removeView(this._tabTreeIndex);
				}
			} else if (e.affectsConfiguration('terminal.integrated.tabsLocation')) {
				this._tabTreeIndex = terminalService.configHelper.config.tabsLocation === 'left' ? 0 : 1;
				this._terminalContainerIndex = terminalService.configHelper.config.tabsLocation === 'left' ? 1 : 0;
				if (this._showTabs) {
					this._splitView.swapViews(0, 1);
				}
			}
		});

		this._splitView = new SplitView(parentElement, { orientation: Orientation.HORIZONTAL });

		this._setupSplitView();
	}

	private _setupSplitView(): void {
		this._register(this._splitView.onDidSashReset(() => this._splitView.distributeViewSizes()));

		if (this._showTabs) {
			this._splitView.addView({
				element: this._terminalTabTree,
				layout: width => this._tabsWidget!.layout(this._height, width),
				minimumSize: 40,
				maximumSize: Number.POSITIVE_INFINITY,
				onDidChange: () => Disposable.None,
			}, Sizing.Distribute, this._tabTreeIndex);
		}
		this._splitView.addView({
			element: this._terminalContainer,
			layout: width => this._terminalService.terminalTabs.forEach(tab => tab.layout(width, this._height || 0)),
			minimumSize: 120,
			maximumSize: Number.POSITIVE_INFINITY,
			onDidChange: () => Disposable.None
		}, Sizing.Distribute, this._terminalContainerIndex);

	}

	layout(width: number, height: number): void {
		this._splitView.layout(width);
		this._height = height;
	}
}
