/*
SUB_2_1 Script
Authors: Cristian Odorico (Alpha93) / KJeff01
 */
include("script/campaign/libcampaign.js");
include("script/campaign/templates.js");
include("script/campaign/transitionTech.js");

var victoryFlag;

const MIS_TRANSPORT_TEAM_PLAYER = 1;
const mis_collectiveRes = [
	"R-Defense-WallUpgrade04", "R-Struc-Materials04", "R-Sys-Engineering02",
	"R-Vehicle-Engine03", "R-Vehicle-Metals03", "R-Cyborg-Metals03",
	"R-Wpn-Cannon-Accuracy02", "R-Wpn-Cannon-Damage04",
	"R-Wpn-Cannon-ROF01", "R-Wpn-Flamer-Damage03", "R-Wpn-Flamer-ROF01",
	"R-Wpn-MG-Damage05", "R-Wpn-MG-ROF02", "R-Wpn-Mortar-Acc01",
	"R-Wpn-Mortar-Damage03", "R-Wpn-Mortar-ROF01",
	"R-Wpn-Rocket-Accuracy02", "R-Wpn-Rocket-Damage04",
	"R-Wpn-Rocket-ROF03", "R-Wpn-RocketSlow-Accuracy03",
	"R-Wpn-RocketSlow-Damage04", "R-Sys-Sensor-Upgrade01"
];

//trigger event when droid reaches the downed transport.
camAreaEvent("crashSite", function(droid)
{
	//Unlikely to happen.
	if (!enumDroid(MIS_TRANSPORT_TEAM_PLAYER).length)
	{
		gameOverMessage(false);
		return;
	}

	const GOODSND = "pcv615.ogg";
	playSound(GOODSND);

	hackRemoveMessage("C21_OBJECTIVE", PROX_MSG, CAM_HUMAN_PLAYER);

	const droids = enumDroid(MIS_TRANSPORT_TEAM_PLAYER);
	for (let i = 0; i < droids.length; ++i)
	{
		donateObject(droids[i], CAM_HUMAN_PLAYER);
	}

	//Give the donation enough time to transfer them to the player. Otherwise
	//the level will end too fast and will trigger asserts in the next level.
	queue("triggerWin", camSecondsToMilliseconds(2));
});

//function that applies damage to units in the downed transport transport team.
function preDamageUnits()
{
	setHealth(getObject("transporter"), 40);
	const droids = enumDroid(MIS_TRANSPORT_TEAM_PLAYER);
	for (let j = 0; j < droids.length; ++j)
	{
		setHealth(droids[j], 40 + camRand(20));
	}
}

//victory callback will thus complete the level.
function triggerWin()
{
	victoryFlag = true;
}

function setupCyborgGroups()
{
	//create group of cyborgs and send them on war path
	camManageGroup(camMakeGroup("cyborgPositionNorth"), CAM_ORDER_ATTACK, {
		regroup: false
	});

	//create group of cyborgs and send them on war path
	camManageGroup(camMakeGroup("cyborgPositionEast"), CAM_ORDER_ATTACK, {
		regroup: false
	});
}

function setCrashedTeamExp()
{
	const DROID_EXP = 32;
	const droids = enumDroid(MIS_TRANSPORT_TEAM_PLAYER).filter((dr) => (
		!camIsSystemDroid(dr) && !camIsTransporter(dr)
	));

	for (let i = 0; i < droids.length; ++i)
	{
		const droid = droids[i];
		setDroidExperience(droid, DROID_EXP);
	}

	preDamageUnits();
}

//Checks if the downed transport has been destroyed and issue a game lose.
function checkCrashedTeam()
{
	if (getObject("transporter") === null)
	{
		return false;
	}

	if (camDef(victoryFlag) && victoryFlag)
	{
		return true;
	}
}

function eventStartLevel()
{
	camSetExtraObjectiveMessage(_("Locate and rescue your units from the shot down transporter"));

	camSetStandardWinLossConditions(CAM_VICTORY_OFFWORLD, "CAM_2B", {
		area: "RTLZ",
		message: "C21_LZ",
		reinforcements: -1,
		callback: "checkCrashedTeam"
	});

	const subLandingZone = getObject("landingZone");
	const startPos = getObject("startingPosition");
	const tEnt = getObject("transporterEntry");
	const tExt = getObject("transporterExit");
	centreView(startPos.x, startPos.y);
	setNoGoArea(subLandingZone.x, subLandingZone.y, subLandingZone.x2, subLandingZone.y2, CAM_HUMAN_PLAYER);
	startTransporterEntry(tEnt.x, tEnt.y, CAM_HUMAN_PLAYER);
	setTransporterExit(tExt.x, tExt.y, CAM_HUMAN_PLAYER);

	const enemyLz = getObject("COLandingZone");
	setNoGoArea(enemyLz.x, enemyLz.y, enemyLz.x2, enemyLz.y2, CAM_THE_COLLECTIVE);

	//Add crash site blip and from an alliance with the crashed team.
	hackAddMessage("C21_OBJECTIVE", PROX_MSG, CAM_HUMAN_PLAYER, false);
	setAlliance(CAM_HUMAN_PLAYER, MIS_TRANSPORT_TEAM_PLAYER, true);

	//set downed transport team colour to be Project Green.
	changePlayerColour(MIS_TRANSPORT_TEAM_PLAYER, 0);

	camCompleteRequiredResearch(mis_collectiveRes, CAM_THE_COLLECTIVE);
	camCompleteRequiredResearch(mis_alphaResearchNew, MIS_TRANSPORT_TEAM_PLAYER);
	camCompleteRequiredResearch(mis_playerResBeta, MIS_TRANSPORT_TEAM_PLAYER);

	if (difficulty >= HARD)
	{
		camUpgradeOnMapTemplates(cTempl.commc, cTempl.commrp, CAM_THE_COLLECTIVE);
	}

	camSetEnemyBases({
		"COHardpointBase": {
			cleanup: "hardpointBaseCleanup",
			detectMsg: "C21_BASE1",
			detectSnd: "pcv379.ogg",
			eliminateSnd: "pcv394.ogg",
		},
		"COBombardBase": {
			cleanup: "bombardBaseCleanup",
			detectMsg: "C21_BASE2",
			detectSnd: "pcv379.ogg",
			eliminateSnd: "pcv394.ogg",
		},
		"COBunkerBase": {
			cleanup: "bunkerBaseCleanup",
			detectMsg: "C21_BASE3",
			detectSnd: "pcv379.ogg",
			eliminateSnd: "pcv394.ogg",
		},
	});

	setCrashedTeamExp();
	victoryFlag = false;
	queue("setupCyborgGroups", camSecondsToMilliseconds(5));
}
