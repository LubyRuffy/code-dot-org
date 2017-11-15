import React, {Component, PropTypes} from 'react';
import color from "../../util/color";
import {sortableSectionShape, OAuthSectionTypes} from "./shapes.jsx";
import PopUpMenu from "@cdo/apps/lib/ui/PopUpMenu";
import i18n from '@cdo/locale';
import {pegasus} from "../../lib/util/urlHelpers";
import {sectionCode,
        sectionName,
        removeSection,
        toggleSectionHidden,
        importOrUpdateRoster} from './teacherSectionsRedux';
import {connect} from 'react-redux';
import PrintCertificates from "./PrintCertificates";
import FontAwesome from '../FontAwesome';
import BaseDialog from '../BaseDialog';
import Button from '../Button';
import DialogFooter from "./DialogFooter";

const styles = {
  actionButton:{
    border: '1px solid ' + color.white,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 4,
    paddingBottom: 4,
    borderRadius: 5,
    color: color.lighter_gray,
    margin: 3
  },
  hoverFocus: {
    backgroundColor: color.lighter_gray,
    border: '1px solid ' + color.light_gray,
    borderRadius: 5,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 5,
    paddingRight: 5,
    color: color.white,
  },
  xIcon: {
    paddingRight: 5,
  },
  heading: {
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderRightWidth: 0,
    borderLeftWidth: 0,
    borderStyle: 'solid',
    borderColor: color.default_text,
    paddingBottom: 20,
    marginBottom: 30,
  },
};

class SectionActionDropdown extends Component {
  static propTypes = {
    handleEdit: PropTypes.func,
    sectionData: sortableSectionShape.isRequired,

    //Provided by redux
    removeSection: PropTypes.func.isRequired,
    toggleSectionHidden: PropTypes.func.isRequired,
    sectionCode: PropTypes.string,
    sectionName: PropTypes.string,
    updateRoster: PropTypes.func.isRequired,
  };

  state = {
    deleting: false,
    open: false,
    canOpen: true,
    menuTop: 0, // location of dropdown menu
    menuLeft: 0,
    currWindowWidth: window.innerWidth, // used to calculate location of menu on resize
  };

  // Menu open
  open = () => {
    this.updateMenuLocation();
    window.addEventListener("resize", this.updateMenuLocation);
    this.setState({open: true, canOpen: false});
  }

  // Menu closed
  close = () => {
    window.removeEventListener("resize", this.updateMenuLocation);
    this.setState({open: false});
  }

  // Menu closed
  beforeClose = (_, resetPortalState) => {
    resetPortalState();
    this.setState({open: false});
    window.setTimeout(() => this.setState({canOpen: true}), 0);
  };

  onConfirmDelete = () => {
      const {removeSection } = this.props;
      const section = this.props.sectionData;
      $.ajax({
          url: `/v2/sections/${section.id}`,
          method: 'DELETE',
      }).done(() => {
          removeSection(section.id);
      }).fail((jqXhr, status) => {
          // We may want to handle this more cleanly in the future, but for now this
          // matches the experience we got in angular
          alert(i18n.unexpectedError());
          console.error(status);
      });
  };

  onClickEdit = () => {
      this.props.handleEdit(this.props.sectionData.id);
  };

  onClickHideShow = () => {
      this.props.toggleSectionHidden(this.props.sectionData.id);
  };

  onClickSync = () => {
    // Section code is the course ID, without the G- or C- prefix.
    const courseId = this.props.sectionCode.replace(/^[GC]-/, '');
    this.props.updateRoster(courseId, this.props.sectionName);
  };

  onRequestDelete = () => {
    this.setState({deleting: true});
  };

  onCancelDelete = () => {
    this.setState({deleting: false});
  }

  updateMenuLocation = () => {
    const rect = this.icon.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    if (windowWidth > 970) { // Accounts for resizing when page is not scrollable
      this.setState({menuTop: rect.bottom + window.pageYOffset});
      this.setState({menuLeft: rect.left - rect.width - (windowWidth - this.state.currWindowWidth)/2});
      this.setState({currWindowWidth : window.innerWidth});
    } else { // Accounts for scrolling or resizing when scrollable
      this.setState({menuTop: rect.bottom + window.pageYOffset});
      this.setState({menuLeft: rect.left - rect.width + window.pageXOffset});
    }
  }

  render() {
    const {sectionData} = this.props;
    const targetPoint = {top: this.state.menuTop, left: this.state.menuLeft};

    return (
      <span
        ref={icon => {this.icon = icon;}}
      >
        <a
          icon="chevron-down"
          style={this.state.open ? {...styles.actionButton, ...styles.hoverFocus} : styles.actionButton}
          onClick={this.state.canOpen ? this.open : undefined}
        >
          <i className="fa fa-chevron-down"></i>
        </a>
        <PopUpMenu
          targetPoint={targetPoint}
          isOpen={this.state.open}
          beforeClose={this.beforeClose}
          minimalStyle={true}
        >
          <PopUpMenu.Item
            heightDivisor={4}
            href={pegasus('/teacher-dashboard#/sections/' + sectionData.id)}
          >
            {i18n.sectionViewProgress()}
          </PopUpMenu.Item>
          <PopUpMenu.Item
            heightDivisor={4}
            href={pegasus('/teacher-dashboard#/sections/' + sectionData.id + "/manage")}
          >
            {i18n.manageStudents()}
          </PopUpMenu.Item>
          <PopUpMenu.Item
            heightDivisor={4}
            href={pegasus('/teacher-dashboard#/sections/' + sectionData.id + '/print_signin_cards')}
          >
            {i18n.printLoginCards()}
          </PopUpMenu.Item>
          <PopUpMenu.MenuBreak/>
          <PopUpMenu.Item
            heightDivisor={4}
            id="ui-test-edit-section"
            onClick={this.onClickEdit}
          >
            {i18n.editSectionDetails()}
          </PopUpMenu.Item>
          <PrintCertificates
            heightDivisor={4}
            sectionId={sectionData.id}
            assignmentName={sectionData.assignmentNames[0]}
          />
          {sectionData.loginType === OAuthSectionTypes.clever &&
            <PopUpMenu.Item
              heightDivisor={4}
              onClick={this.onClickSync}
            >
              {i18n.syncClever()}
            </PopUpMenu.Item>
          }
          {sectionData.loginType === OAuthSectionTypes.google_classroom &&
            <PopUpMenu.Item
              heightDivisor={4}
              onClick={this.onClickSync}
            >
              {i18n.syncGoogleClassroom()}
            </PopUpMenu.Item>
          }
          <PopUpMenu.Item
            heightDivisor={4}
            onClick={this.onClickHideShow}
          >
            {this.props.sectionData.hidden ? i18n.showSection() : i18n.hideSection()}
          </PopUpMenu.Item>
          {sectionData.studentCount === 0 &&
            <PopUpMenu.Item
              heightDivisor={4}
              onClick={this.onRequestDelete}
              color={color.red}
            >
              <FontAwesome icon=" fa-times-circle" style={styles.xIcon}/>
              {i18n.deleteSection()}
            </PopUpMenu.Item>
          }
        </PopUpMenu>
        <BaseDialog
          useUpdatedStyles
          uncloseable
          assetUrl={() => {}}
          isOpen={this.state.deleting}
          style={{paddingLeft: 20, paddingRight: 20, paddingBottom: 20}}
        >
          <h2 style={styles.heading}>{i18n.deleteSection()}</h2>
          <div>{i18n.deleteSectionConfirm()}</div>
          <br/>
          <div>{i18n.deleteSectionHideSuggestion()}</div>
          <DialogFooter>
            <Button
              text={i18n.dialogCancel()}
              onClick={this.onCancelDelete}
              color="gray"
            />
            <Button
              text={i18n.delete()}
              onClick={this.onConfirmDelete}
              color="red"
            />
          </DialogFooter>
        </BaseDialog>
      </span>
    );
  }
}

export const UnconnectedSectionActionDropdown = SectionActionDropdown;

export default connect((state, props) => ({
  sectionCode: sectionCode(state, props.sectionData.id),
  sectionName: sectionName(state, props.sectionData.id),
}), {
  removeSection,
  toggleSectionHidden,
  updateRoster: importOrUpdateRoster,
})(SectionActionDropdown);
